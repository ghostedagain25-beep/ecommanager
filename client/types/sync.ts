import type { WooCommerceProduct, WooCommerceUpdatePayload } from './woocommerce';
import type { ShopifyVariantUpdatePayload } from './shopify';

export interface SyncStatus {
  state: 'idle' | 'previewing' | 'updating' | 'success' | 'error';
  message: string;
}

export interface SyncResult {
  updated: number;
  notFound: number;
  upToDate: number;
  errors: number;
}

export interface ChangeDetail {
  old: string | number | null;
  new: string | number | null;
}

export interface ChangesObject {
  [key: string]: ChangeDetail | string;
}

// A generic item shape for the preview component
export interface PreviewableItem {
  sku: string;
  name: string;
  changes: ChangesObject;
}

export interface ProductSyncChange extends WooCommerceProduct {
  changes: ChangesObject;
}

export interface SyncHistorySummary {
  id: number;
  user_username: string;
  sync_timestamp: string;
  total_processed: number;
  total_updated: number;
  total_not_found: number;
  total_up_to_date: number;
  total_errors: number;
}

export interface SyncDetail {
  id: number;
  sync_id: number;
  sku: string;
  product_name: string;
  status: 'updated' | 'not_found' | 'up_to_date' | 'error';
  changes_json: string;
}

export interface SyncPreviewData {
  toUpdate: PreviewableItem[];
  upToDate: { sku: string; name: string }[];
  notFound: { sku: string; product_name: string }[];
  updatePayload: WooCommerceUpdatePayload[] | ShopifyVariantUpdatePayload[];
  syncDetailsForReport: Omit<SyncDetail, 'id' | 'sync_id'>[];
}
