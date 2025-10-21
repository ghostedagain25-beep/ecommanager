import type { Website } from '../types/index';
import type {
  WooCommerceProduct,
  WooCommerceUpdatePayload,
  WooCommerceOrder,
  WooCommerceProductCategory,
} from '../types/woocommerce';
import { apiFetch } from './apiClient';

export const fetchWooCommerceProducts = async (
  website: Website,
  skus: string[],
  perPage: number = 100,
): Promise<WooCommerceProduct[]> => {
  const allProducts: WooCommerceProduct[] = [];
  if (skus.length === 0) return allProducts;

  for (let i = 0; i < skus.length; i += perPage) {
    const chunk = skus.slice(i, i + perPage);
    const skuString = chunk.join(',');
    const path = `products?sku=${skuString}&per_page=${perPage}`;
    try {
      const response = await apiFetch(website, path);
      const products: WooCommerceProduct[] = await response.json();
      allProducts.push(...products);
    } catch (error) {
      console.error('Failed to fetch products for SKUs:', chunk, error);
      throw error;
    }
  }
  return allProducts;
};

export const batchUpdateWooCommerceProducts = async (
  website: Website,
  payload: WooCommerceUpdatePayload[],
): Promise<{ updatedCount: number; errorDetails: { id: number; message: string }[] }> => {
  if (payload.length === 0) {
    return { updatedCount: 0, errorDetails: [] };
  }

  const path = `products/batch`;
  const body = JSON.stringify({ update: payload });

  let updatedCount = 0;
  const errorDetails: { id: number; message: string }[] = [];

  try {
    const response = await apiFetch(website, path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const result = await response.json();

    if (result && Array.isArray(result.update)) {
      const successfulIds = new Set(result.update.map((p: any) => p.id));
      payload.forEach((item) => {
        if (successfulIds.has(item.id)) {
          updatedCount++;
        } else {
          errorDetails.push({ id: item.id, message: 'Update failed for an unknown reason.' });
        }
      });
    }
  } catch (error) {
    console.error('Batch update failed:', error);
    payload.forEach((p) => errorDetails.push({ id: p.id, message: (error as Error).message }));
  }

  return { updatedCount, errorDetails };
};

export const fetchWooCommerceOrders = async (
  website: Website,
  page: number = 1,
  perPage: number = 25,
): Promise<WooCommerceOrder[]> => {
  const path = `orders?per_page=${perPage}&page=${page}&orderby=date&order=desc&_fields=id,number,total,status,date_created,billing`;
  try {
    const response = await apiFetch(website, path);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
};

export const fetchWooCommerceOrder = async (
  website: Website,
  orderId: number,
): Promise<WooCommerceOrder> => {
  const path = `orders/${orderId}?_fields=id,number,total,status,date_created,billing,shipping,line_items,payment_method_title,customer_note,shipping_lines,total_tax,currency`;
  try {
    const response = await apiFetch(website, path);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch order ${orderId}:`, error);
    throw error;
  }
};

export const updateWooCommerceOrder = async (
  website: Website,
  orderId: number,
  data: { status: 'completed' | 'cancelled' },
): Promise<WooCommerceOrder> => {
  const path = `orders/${orderId}`;
  try {
    const response = await apiFetch(website, path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error);
    throw error;
  }
};

export const fetchWooCommerceProductCategories = async (
  website: Website,
): Promise<WooCommerceProductCategory[]> => {
  const allCategories: WooCommerceProductCategory[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const path = `products/categories?per_page=${perPage}&page=${page}&orderby=name&order=asc&_fields=id,name,slug,parent,description,count`;
    try {
      const response = await apiFetch(website, path);
      const categories: WooCommerceProductCategory[] = await response.json();

      if (categories.length === 0) break;
      allCategories.push(...categories);
      if (categories.length < perPage) break;
      page++;
    } catch (error) {
      console.error('Failed to fetch product categories:', error);
      throw error;
    }
  }

  return allCategories;
};

export const fetchAllWooCommerceProducts = async (
  website: Website,
  page: number = 1,
  perPage: number = 25,
  searchTerm: string = '',
  categoryId: string = '',
): Promise<WooCommerceProduct[]> => {
  let path = `products?per_page=${perPage}&page=${page}&orderby=date&order=desc&_fields=id,name,sku,regular_price,sale_price,stock_quantity,images,description,short_description,categories`;
  if (searchTerm) path += `&search=${encodeURIComponent(searchTerm)}`;
  if (categoryId) path += `&category=${categoryId}`;

  try {
    const response = await apiFetch(website, path);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};

export const createWooCommerceProduct = async (
  website: Website,
  productData: Partial<WooCommerceProduct>,
): Promise<WooCommerceProduct> => {
  const response = await apiFetch(website, 'products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  return response.json();
};

export const updateWooCommerceProduct = async (
  website: Website,
  productId: number,
  productData: Partial<WooCommerceProduct>,
): Promise<WooCommerceProduct> => {
  const response = await apiFetch(website, `products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  return response.json();
};

export const deleteWooCommerceProduct = async (
  website: Website,
  productId: number,
): Promise<{ id: number }> => {
  const response = await apiFetch(website, `products/${productId}?force=true`, {
    method: 'DELETE',
  });
  const deletedProduct = await response.json();
  return { id: deletedProduct.id };
};

export const batchDeleteWooCommerceProducts = async (
  website: Website,
  productIds: number[],
): Promise<{ deletedCount: number; errorDetails: { id: number; message: string }[] }> => {
  if (productIds.length === 0) return { deletedCount: 0, errorDetails: [] };

  const body = { delete: productIds };
  const errorDetails: { id: number; message: string }[] = [];

  try {
    const response = await apiFetch(website, 'products/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    const successfulIds = new Set(result.delete?.map((p: any) => p.id) || []);

    productIds.forEach((id) => {
      if (!successfulIds.has(id)) {
        errorDetails.push({ id, message: 'Deletion failed for an unknown reason.' });
      }
    });
    return { deletedCount: successfulIds.size, errorDetails };
  } catch (error) {
    console.error('Batch delete products failed:', error);
    productIds.forEach((pId) => errorDetails.push({ id: pId, message: (error as Error).message }));
    return { deletedCount: 0, errorDetails };
  }
};

export const createWooCommerceCategory = async (
  website: Website,
  categoryData: { name: string; parent?: number; description?: string },
): Promise<WooCommerceProductCategory> => {
  const response = await apiFetch(website, 'products/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData),
  });
  return response.json();
};

export const updateWooCommerceCategory = async (
  website: Website,
  categoryId: number,
  categoryData: { name?: string; parent?: number; description?: string },
): Promise<WooCommerceProductCategory> => {
  const response = await apiFetch(website, `products/categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData),
  });
  return response.json();
};

export const deleteWooCommerceCategory = async (
  website: Website,
  categoryId: number,
): Promise<WooCommerceProductCategory> => {
  const response = await apiFetch(website, `products/categories/${categoryId}?force=true`, {
    method: 'DELETE',
  });
  return response.json();
};

export const batchDeleteWooCommerceCategories = async (
  website: Website,
  categoryIds: number[],
): Promise<{ deletedCount: number; errorDetails: { id: number; message: string }[] }> => {
  if (categoryIds.length === 0) return { deletedCount: 0, errorDetails: [] };

  const body = { delete: categoryIds };
  const errorDetails: { id: number; message: string }[] = [];

  try {
    const response = await apiFetch(website, 'products/categories/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    const successfulIds = new Set(result.delete?.map((p: any) => p.id) || []);

    categoryIds.forEach((id) => {
      if (!successfulIds.has(id)) {
        errorDetails.push({ id, message: 'Deletion failed for an unknown reason.' });
      }
    });
    return { deletedCount: successfulIds.size, errorDetails };
  } catch (error) {
    console.error('Batch delete categories failed:', error);
    categoryIds.forEach((cId) => errorDetails.push({ id: cId, message: (error as Error).message }));
    return { deletedCount: 0, errorDetails };
  }
};
