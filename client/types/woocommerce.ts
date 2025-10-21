export interface WooCommerceProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooCommerceProductCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  sku: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  manage_stock?: boolean;
  description?: string;
  short_description?: string;
  images?: WooCommerceProductImage[];
  categories?: WooCommerceProductCategory[];
}

export interface WooCommerceUpdatePayload {
  id: number;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number;
}

// WooCommerce Order types
export interface OrderBilling {
  first_name: string;
  last_name: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | string;

export interface OrderLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  total: string;
  price: number;
  sku: string;
}

export interface OrderShipping {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface OrderShippingLine {
  id: number;
  method_title: string;
  total: string;
}

export interface WooCommerceOrder {
  id: number;
  number: string;
  total: string;
  status: OrderStatus;
  date_created: string;
  billing: OrderBilling;
  siteName?: string; // Add this for multi-site view
  // New fields for details view
  shipping: OrderShipping;
  line_items: OrderLineItem[];
  payment_method_title: string;
  customer_note: string;
  shipping_lines: OrderShippingLine[];
  total_tax: string;
  currency: string;
}
