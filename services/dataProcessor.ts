import * as XLSX from 'xlsx';
// FIX: Update import path for types.
import type { RawRow, WorkflowStep } from '../types/processing';
// FIX: Update import path for constants.
import { 
  ITEM_CODE, MRP, SALE_RATE, PURCHASE_RATE, CLOSING_STOCK_QTY, DISCOUNT,
  SKU, REGULAR_PRICE, SALE_PRICE, STOCK, OLD_SALE_PRICE
} from '../config/constants';

const safeCeil = (val: any): number => {
  const num = Number(val);
  return isNaN(num) ? 0 : Math.ceil(num);
};

const cleanDiscount = (value: any): number => {
    if (typeof value === 'number') return safeCeil(value);
    if (!value || typeof value !== 'string') return 0;
    const cleaned = value.replace(/%/g, '').trim().toLowerCase();
    if (cleaned === 'nil' || cleaned === '(nil)' || cleaned === '') return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : safeCeil(num);
};

/**
 * Reads an Excel file and converts its first sheet to JSON, skipping the first two rows.
 * @param file The Excel file to read.
 * @returns A promise that resolves to an array of raw row objects.
 */
const readSheet = async (file: File): Promise<RawRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<RawRow>(sheet, { range: 2 });
};

/**
 * Cleans the Closing Stock data by filtering rows and sanitizing numeric values.
 * @param data Raw data from the Closing Stock sheet.
 * @returns Cleaned data.
 */
const cleanClosingStockData = (data: RawRow[]): RawRow[] => {
    return data
      .filter(row => row[SALE_RATE] !== null && row[SALE_RATE] !== undefined && row[SALE_RATE] !== '')
      .map(row => ({
        ...row,
        [CLOSING_STOCK_QTY]: safeCeil(row[CLOSING_STOCK_QTY]),
        [MRP]: safeCeil(row[MRP]),
        [SALE_RATE]: safeCeil(row[SALE_RATE]),
        [PURCHASE_RATE]: safeCeil(row[PURCHASE_RATE]),
      }))
      .filter(row => row[PURCHASE_RATE] >= 0 && row[CLOSING_STOCK_QTY] >= 0);
};

/**
 * Deduplicates Closing Stock items based on ITEM_CODE, keeping the one with the highest MRP and stock quantity.
 * @param data Cleaned Closing Stock data.
 * @returns Deduplicated and structured data.
 */
const deduplicateClosingStockData = (data: RawRow[]): any[] => {
    const groupedByItemCode = data.reduce<Record<string, RawRow[]>>((acc, row) => {
        const itemCode = String(row[ITEM_CODE]);
        if (!acc[itemCode]) acc[itemCode] = [];
        acc[itemCode].push(row);
        return acc;
    }, {});
    
    const deduplicatedRows = Object.values(groupedByItemCode).map(group => {
        return group.sort((a, b) => {
            if (b[MRP] !== a[MRP]) return b[MRP] - a[MRP];
            return b[CLOSING_STOCK_QTY] - a[CLOSING_STOCK_QTY];
        })[0];
    });

    return deduplicatedRows.map(row => ({
      [ITEM_CODE]: row[ITEM_CODE],
      [MRP]: row[MRP],
      [SALE_RATE]: row[SALE_RATE],
      [PURCHASE_RATE]: row[PURCHASE_RATE],
      [CLOSING_STOCK_QTY]: row[CLOSING_STOCK_QTY],
    }));
};

/**
 * Cleans the Item Directory data by sanitizing discount and MRP values.
 * @param data Raw data from the Item Directory sheet.
 * @returns Cleaned data.
 */
const cleanItemDirectoryData = (data: RawRow[]): any[] => {
    return data.map(row => ({
      [ITEM_CODE]: row[ITEM_CODE],
      [DISCOUNT]: cleanDiscount(row[DISCOUNT]),
      [MRP]: safeCeil(row[MRP]),
    }));
};

/**
 * Renames columns of the Closing Stock data to their final format.
 * @param data Deduplicated Closing Stock data.
 * @returns Data with renamed columns.
 */
const renameColumns = (data: any[]): any[] => {
    return data.map(row => ({
      [SKU]: row[ITEM_CODE],
      [REGULAR_PRICE]: row[MRP],
      [OLD_SALE_PRICE]: row[SALE_RATE],
      [PURCHASE_RATE]: row[PURCHASE_RATE],
      [STOCK]: row[CLOSING_STOCK_QTY],
    }));
};

/**
 * Applies discounts from the Item Directory to the Closing Stock data using a VLOOKUP-like mechanism.
 * @param closingStockData Data with renamed columns.
 * @param itemDirectoryData Cleaned Item Directory data.
 * @returns Closing Stock data with an added DISCOUNT column.
 */
const applyDiscounts = (closingStockData: any[], itemDirectoryData: any[]): any[] => {
    const discountMap = new Map<string, number>();
    itemDirectoryData.forEach(row => {
      if (row[ITEM_CODE]) {
        discountMap.set(String(row[ITEM_CODE]), row[DISCOUNT]);
      }
    });

    return closingStockData.map(row => ({
      ...row,
      [DISCOUNT]: discountMap.get(String(row[SKU])) || 0
    }));
};

/**
 * Calculates the 'SALE PRICE' based on the old sale price and discount.
 * @param data Data with an applied DISCOUNT column.
 * @returns Data with the 'SALE PRICE' column.
 */
const calculateNewSalePrice = (data: any[]): any[] => {
    return data.map(row => ({
      ...row,
      [SALE_PRICE]: Math.ceil(row[OLD_SALE_PRICE] * (1 - (row[DISCOUNT] / 100)))
    }));
};

/**
 * Finalizes the data by removing the temporary DISCOUNT column.
 * @param data Data with the new sale price calculated.
 * @returns Final data ready for export.
 */
const finalizeData = (data: any[]): any[] => {
    return data.map(({ [DISCOUNT]: _, ...rest }) => rest);
};

/**
 * Converts the final JSON data to a CSV string.
 * @param data The final array of data objects.
 * @returns A CSV string.
 */
export const convertToCsv = (data: any[]): string => {
    const finalSheet = XLSX.utils.json_to_sheet(data);
    return XLSX.utils.sheet_to_csv(finalSheet);
};

/**
 * Orchestrates the entire data processing workflow from reading files to generating the final JSON data.
 */
export const processStockFiles = async (
  closingStockFile: File,
  itemDirectoryFile: File,
  workflowConfig: WorkflowStep[],
  updateStep: (step: number) => void
): Promise<any[]> => {
  let stepCounter = 1;

  const isStepEnabled = (key: string): boolean => {
    const step = workflowConfig.find(s => s.step_key === key);
    return step ? step.is_enabled : false;
  };

  updateStep(stepCounter++);
  const [closingStockRaw, itemDirectoryRaw] = await Promise.all([
    readSheet(closingStockFile),
    readSheet(itemDirectoryFile)
  ]);

  let data = closingStockRaw;

  if (isStepEnabled('cleanClosingStock')) {
    updateStep(stepCounter++);
    data = cleanClosingStockData(data);
  }

  if (isStepEnabled('deduplicateClosingStock')) {
    updateStep(stepCounter++);
    data = deduplicateClosingStockData(data);
  }

  let itemDirectoryData = itemDirectoryRaw;
  if (isStepEnabled('cleanItemDirectory')) {
    updateStep(stepCounter++);
    itemDirectoryData = cleanItemDirectoryData(itemDirectoryData);
  }
  
  if (isStepEnabled('renameColumns')) {
    updateStep(stepCounter++);
    data = renameColumns(data);
  }

  if (isStepEnabled('applyDiscounts')) {
    updateStep(stepCounter++);
    data = applyDiscounts(data, itemDirectoryData);
  }

  if (isStepEnabled('calculateNewSalePrice')) {
    updateStep(stepCounter++);
    data = calculateNewSalePrice(data);
  }
  
  if (isStepEnabled('finalizeData')) {
    updateStep(stepCounter++);
    data = finalizeData(data);
  }

  updateStep(stepCounter++);
  
  return data;
};