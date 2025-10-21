// Types for interacting with the Shopify Admin API

export interface ShopifyImage {
  id: number;
  product_id: number;
  src: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string; // Variant title (e.g., "Small", "Red")
  sku: string;
  price: string;
  compare_at_price: string | null;
  inventory_quantity: number;
  inventory_item_id: number;
  // This will be added from the parent product for convenience
  product_title?: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export interface ShopifyVariantUpdatePayload {
  variant_id: number;
  price?: string;
  compare_at_price?: string;
  inventory_quantity?: number;
  inventory_item_id: number;
}

// --- Shopify Order Types ---

export interface ShopifyCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ShopifyLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
  name: string; // Combination of title and variant title
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string; // Equivalent to state
  zip: string; // Equivalent to postcode
  country: string;
}

export interface ShopifyShippingLine {
  title: string;
  price: string;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  total_price: string;
  financial_status: string; // e.g., 'paid', 'pending', 'refunded'
  fulfillment_status: string | null; // e.g., 'fulfilled', 'unfulfilled', 'partial'
  created_at: string;
  customer: ShopifyCustomer;
  line_items: ShopifyLineItem[];
  shipping_address: ShopifyAddress;
  billing_address: ShopifyAddress;
  note: string | null;
  shipping_lines: ShopifyShippingLine[];
  total_tax: string;
  currency: string;
  cancelled_at: string | null;
}
