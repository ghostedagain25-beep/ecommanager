import React, { useState, useEffect } from 'react';
// FIX: Update import path for types.
import type { WooCommerceProduct, WooCommerceProductCategory } from '../../types/woocommerce';
import { SpinnerIcon, SaveIcon, CancelIcon } from '../ui/icons';

interface ProductFormProps {
  product: WooCommerceProduct | null;
  categories: WooCommerceProductCategory[];
  onSave: (productData: Partial<WooCommerceProduct>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    regular_price: '',
    sale_price: '',
    stock_quantity: null as number | null | string,
    description: '',
    short_description: '',
    image_url: '',
    selected_category_id: '',
  });

  const isEditing = !!product?.id;

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        regular_price: product.regular_price || '',
        sale_price: product.sale_price || '',
        stock_quantity: product.stock_quantity ?? null,
        description: product.description || '',
        short_description: product.short_description || '',
        image_url: product.images?.[0]?.src || '',
        selected_category_id: product.categories?.[0]?.id.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        regular_price: '',
        sale_price: '',
        stock_quantity: null,
        description: '',
        short_description: '',
        image_url: '',
        selected_category_id: '',
      });
    }
  }, [product]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalStockQuantity =
      formData.stock_quantity !== null && formData.stock_quantity !== ''
        ? Number(formData.stock_quantity)
        : null;

    const productData: Partial<WooCommerceProduct> = {
      name: formData.name,
      sku: formData.sku,
      regular_price: formData.regular_price,
      sale_price: formData.sale_price,
      description: formData.description,
      short_description: formData.short_description,
      stock_quantity: finalStockQuantity,
      manage_stock: finalStockQuantity !== null,
    };

    if (formData.selected_category_id) {
      // FIX: The WooCommerce API accepts an object with just an `id` for categories. Cast to `any` to satisfy TypeScript's strict `WooCommerceProductCategory` type.
      productData.categories = [{ id: Number(formData.selected_category_id) }] as any;
    } else {
      productData.categories = [];
    }

    if (formData.image_url) {
      // FIX: The WooCommerce API accepts an object with just a `src` for images. Cast to `any` to satisfy TypeScript's strict `WooCommerceProductImage` type.
      productData.images = [{ src: formData.image_url }] as any;
    } else if (isEditing) {
      productData.images = [];
    }

    onSave(productData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-slate-800 border border-slate-700 rounded-lg space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto"
    >
      <h2 className="text-xl font-semibold text-white">
        {isEditing ? `Editing: ${product?.name}` : 'Create New Product'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">SKU</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Stock Quantity</label>
          <input
            type="number"
            name="stock_quantity"
            value={formData.stock_quantity ?? ''}
            onChange={handleChange}
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Regular Price</label>
          <input
            type="text"
            name="regular_price"
            value={formData.regular_price}
            onChange={handleChange}
            pattern="^\d*(\.\d*)?$"
            inputMode="decimal"
            title="Please enter a valid price (e.g., 12.99)."
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Sale Price</label>
          <input
            type="text"
            name="sale_price"
            value={formData.sale_price}
            onChange={handleChange}
            pattern="^\d*(\.\d*)?$"
            inputMode="decimal"
            title="Please enter a valid price (e.g., 9.99)."
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Product Image URL</label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Category</label>
          <select
            name="selected_category_id"
            value={formData.selected_category_id}
            onChange={handleChange}
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Short Description</label>
          <textarea
            name="short_description"
            value={formData.short_description}
            onChange={handleChange}
            rows={3}
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 border-t border-slate-700 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors disabled:opacity-50"
        >
          <CancelIcon className="w-5 h-5 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600"
        >
          {isSaving ? (
            <SpinnerIcon className="w-5 h-5 mr-2" />
          ) : (
            <SaveIcon className="w-5 h-5 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
