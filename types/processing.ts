export type RawRow = Record<string, any>;

export interface FinalStockData {
    [key: string]: string | number;
    SKU: string;
    'REGULAR PRICE': number;
    'SALE PRICE': number;
    STOCK: number;
    'OLD SALE PRICE': number;
    'PURCHASE RATE': number;
}

export interface WorkflowStep {
    id: number;
    step_key: string;
    step_name: string;
    description: string;
    step_order: number;
    is_enabled: boolean;
    is_mandatory: boolean;
}
