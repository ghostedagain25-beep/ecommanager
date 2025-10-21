import React, { useState, useEffect } from 'react';
// FIX: Update import path for types.
import type { WooCommerceProductCategory } from '../../types/woocommerce';
import { SpinnerIcon, SaveIcon, CancelIcon } from '../ui/icons';

interface CategoryFormProps {
  category: WooCommerceProductCategory | null;
  allCategories: WooCommerceProductCategory[];
  onSave: (categoryData: Partial<WooCommerceProductCategory>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  allCategories,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    parent: 0,
    description: '',
  });

  const isEditing = !!category?.id;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        parent: category.parent || 0,
        description: category.description || '',
      });
    } else {
      setFormData({
        name: '',
        parent: 0,
        description: '',
      });
    }
  }, [category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const finalValue = name === 'parent' ? parseInt(value, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Prevent a category from being its own parent
  const parentCategoryOptions = allCategories.filter((c) => c.id !== category?.id);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-slate-800 border border-slate-700 rounded-lg space-y-6 animate-fade-in"
    >
      <h2 className="text-xl font-semibold text-white">
        {isEditing ? `Editing: ${category?.name}` : 'Create New Category'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Parent Category</label>
          <select
            name="parent"
            value={formData.parent}
            onChange={handleChange}
            className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="0">— No parent —</option>
            {parentCategoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
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
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
