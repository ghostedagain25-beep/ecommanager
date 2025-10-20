// A standardized format for displaying orders in the UI
export interface FormattedLineItem {
    id: number | string;
    name: string;
    quantity: number;
    total: string;
    sku: string;
}

export interface FormattedAddress {
    name: string;
    address1: string;
    address2?: string;
    cityStateZip: string;
    country: string;
}

export interface FormattedOrder {
    id: number;
    platform: 'wordpress' | 'shopify';
    orderNumber: string;
    customerName: string;
    date: string;
    status: string;
    total: string;
    currencySymbol: string;

    // For detail view
    lineItems?: FormattedLineItem[];
    billingAddress?: FormattedAddress;
    shippingAddress?: FormattedAddress;
    shippingMethod?: string;
    totalTax?: string;
    customerNote?: string;
    canComplete?: boolean;
    canCancel?: boolean;
}
