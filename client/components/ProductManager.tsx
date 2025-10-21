import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import * as wooApi from '../services/wooCommerceApi';
import type { User, Website } from '../types/index';
import type { WooCommerceProduct, WooCommerceProductCategory } from '../types/woocommerce';
import {
  SpinnerIcon,
  ExclamationIcon,
  UserIcon,
  ArrowLeftIcon,
  WordPressIcon,
  SearchIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  Trash2Icon,
  ArrowDownIcon,
} from './ui/icons';
import ProductForm from './ProductForm';
import { useAuth } from '../context/AuthContext';
import { useWebsite } from '../context/WebsiteContext';
import { ConfirmationModal } from './ui/ConfirmationModal';

type ViewState = 'select_user' | 'show_products';

interface ProductManagerProps {
  isAdminView?: boolean;
}

const ProductManager: React.FC<ProductManagerProps> = ({ isAdminView = false }) => {
  const { user: loggedInUser } = useAuth();
  const {
    websites,
    selectedWebsite,
    selectedUser,
    isLoading: websiteLoading,
    error: websiteError,
    setSelectedWebsite,
    setSelectedUser,
  } = useWebsite();

  const [viewState, setViewState] = useState<ViewState>(
    isAdminView ? 'select_user' : 'show_products',
  );
  const [users, setUsers] = useState<User[]>([]);

  const [products, setProducts] = useState<WooCommerceProduct[]>([]);
  const [categories, setCategories] = useState<WooCommerceProductCategory[]>([]);
  const [page, setPage] = useState(1);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState<WooCommerceProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [productToDelete, setProductToDelete] = useState<WooCommerceProduct | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (isAdminView && viewState === 'select_user') {
      const loadUsers = async () => {
        setIsLoading(true);
        try {
          const allUsers = await api.getUsers();
          setUsers(allUsers.filter((u) => u.role === 'user'));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load users');
        }
        setIsLoading(false);
      };
      loadUsers();
    }
  }, [isAdminView, viewState]);

  // Website loading is now handled by WebsiteContext
  // This effect is removed to avoid conflicts

  const fetchProducts = useCallback(
    async (pageNum: number, search: string, categoryId: string, refreshing = false) => {
      if (!selectedWebsite) return;
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      try {
        // FIX: The `fetchAllWooCommerceProducts` function expects a `Website` object, not separate credentials.
        const newProducts = await wooApi.fetchAllWooCommerceProducts(
          selectedWebsite,
          pageNum,
          25,
          search,
          categoryId,
        );
        setProducts((prev) => (refreshing ? newProducts : [...prev, ...newProducts]));
        setCanLoadMore(newProducts.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products.');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedWebsite],
  );

  const handleUserSelect = useCallback(async (userToSelect: User) => {
    setSelectedUser(userToSelect);
    setViewState('show_products');
  }, []);

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const websiteId = e.target.value;
    const newWebsite = websites.find((w) => w.id.toString() === websiteId);
    if (newWebsite) {
      setSelectedWebsite(newWebsite);
    }
  };

  useEffect(() => {
    if (selectedWebsite) {
      setPage(1);
      setSearchTerm('');
      setSelectedCategoryId('');
      setCategories([]);
      setSelectedProductIds(new Set());
      fetchProducts(1, '', '', true);

      const fetchCats = async () => {
        try {
          // FIX: The `fetchWooCommerceProductCategories` function expects a `Website` object, not separate credentials.
          const cats = await wooApi.fetchWooCommerceProductCategories(selectedWebsite);
          setCategories(cats);
        } catch (catErr) {
          console.error('Could not fetch categories', catErr);
        }
      };
      fetchCats();
    }
  }, [selectedWebsite, fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1, searchTerm, selectedCategoryId, true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setSelectedCategoryId(catId);
    setPage(1);
    fetchProducts(1, searchTerm, catId, true);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, searchTerm, selectedCategoryId);
  };

  const handleBackToUsers = () => {
    setError(null);
    setProducts([]);
    setSelectedUser(null);
    setSelectedWebsite(null);
    setViewState('select_user');
  };

  const handleSaveProduct = async (productData: Partial<WooCommerceProduct>) => {
    if (!selectedWebsite) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (productToEdit?.id) {
        // FIX: The `updateWooCommerceProduct` function expects a `Website` object, not separate credentials.
        await wooApi.updateWooCommerceProduct(selectedWebsite, productToEdit.id, productData);
        setSuccessMessage('Product updated successfully.');
      } else {
        // FIX: The `createWooCommerceProduct` function expects a `Website` object, not separate credentials.
        await wooApi.createWooCommerceProduct(selectedWebsite, productData);
        setSuccessMessage('Product created successfully.');
      }
      setIsFormVisible(false);
      setProductToEdit(null);
      fetchProducts(1, searchTerm, selectedCategoryId, true); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete || !selectedWebsite) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // FIX: The `deleteWooCommerceProduct` function expects a `Website` object, not separate credentials.
      await wooApi.deleteWooCommerceProduct(selectedWebsite, productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setSuccessMessage('Product deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setIsLoading(false);
      setProductToDelete(null);
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(new Set(products.map((p) => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedWebsite || selectedProductIds.size === 0) return;

    setIsBulkDeleteModalOpen(false);
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // FIX: The `batchDeleteWooCommerceProducts` function expects a `Website` object, not separate credentials.
      const { deletedCount, errorDetails } = await wooApi.batchDeleteWooCommerceProducts(
        selectedWebsite,
        Array.from(selectedProductIds),
      );

      let messages = [];
      if (deletedCount > 0) messages.push(`${deletedCount} products deleted successfully.`);
      if (errorDetails.length > 0) messages.push(`${errorDetails.length} deletions failed.`);
      setSuccessMessage(messages.join(' '));

      if (errorDetails.length > 0) {
        setError(`Failed to delete products with IDs: ${errorDetails.map((e) => e.id).join(', ')}`);
      }

      setSelectedProductIds(new Set());
      fetchProducts(1, searchTerm, selectedCategoryId, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred during bulk deletion.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdminView && viewState === 'select_user') {
    return (
      <div className="animate-fade-in">
        <header className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white">Select a User to Manage Products</h2>
        </header>
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <SpinnerIcon className="w-8 h-8 text-sky-400" />
          </div>
        )}
        {error && (
          <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg mb-4">
            <ExclamationIcon className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}
        {users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((item) => (
              <button
                key={item.username}
                onClick={() => handleUserSelect(item)}
                className="bg-slate-800 p-6 rounded-lg text-left hover:bg-slate-700/80 border border-slate-700 hover:border-sky-500 transition-all transform hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <UserIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-lg text-white">{item.username}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-10 bg-slate-900/50 rounded-lg">
              <UserIcon className="w-12 h-12 mx-auto text-gray-500" />
              <h3 className="mt-2 text-lg font-medium text-white">No users found</h3>
            </div>
          )
        )}
      </div>
    );
  }

  if (isFormVisible) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-2xl">
          <ProductForm
            product={productToEdit}
            categories={categories}
            isSaving={isSaving}
            onSave={handleSaveProduct}
            onCancel={() => {
              setIsFormVisible(false);
              setProductToEdit(null);
              setError(null);
            }}
          />
          {error && (
            <div className="mt-4 flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg">
              <ExclamationIcon className="w-5 h-5 mr-3" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewState === 'show_products') {
    if (isLoading && products.length === 0) {
      return (
        <div className="flex justify-center items-center h-full">
          <SpinnerIcon className="w-8 h-8 text-sky-400" />
        </div>
      );
    }

    if (!selectedWebsite) {
      return (
        <div className="animate-fade-in text-center">
          {isAdminView && (
            <button
              onClick={handleBackToUsers}
              className="flex items-center gap-2 mb-6 text-sm text-gray-400 hover:text-white mx-auto"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back to User Selection
            </button>
          )}
          <div className="py-10 bg-slate-900/50 rounded-lg">
            <WordPressIcon className="w-12 h-12 mx-auto text-gray-500" />
            <h3 className="mt-2 text-lg font-medium text-white">No websites configured</h3>
            <p className="mt-1 text-sm text-gray-400">
              {isAdminView
                ? 'This user does not have any websites set up.'
                : 'Please go to Settings to add a new website.'}
            </p>
          </div>
        </div>
      );
    }
  }

  const allOnPageSelected =
    products.length > 0 && products.every((p) => selectedProductIds.has(p.id));

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        {isAdminView && (
          <button
            onClick={handleBackToUsers}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-2"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to User Selection
          </button>
        )}
        <h1 className="text-3xl font-bold text-white tracking-tight">Product Management</h1>
        <p className="text-gray-400">
          {isAdminView
            ? `Managing products for ${selectedUser?.username} on `
            : 'Managing your products on '}
          <span className="text-sky-400">{selectedWebsite?.name}</span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
        <form
          onSubmit={handleSearch}
          className="flex-grow flex flex-col sm:flex-row gap-2 w-full md:w-auto"
        >
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder={`Search products...`}
              className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat, index) => (
              <option key={cat.id || `category-${index}`} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </form>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {websites.length > 1 && (
            <select
              id="website-select"
              value={selectedWebsite?.id || ''}
              onChange={handleWebsiteChange}
              className="bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500 w-full"
            >
              {websites.map((site, index) => (
                <option key={site.id || `website-${index}`} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsFormVisible(true);
            }}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white w-full justify-center md:w-auto"
          >
            <PlusCircleIcon className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg">
          <ExclamationIcon className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}
      {successMessage && (
        <div className="flex items-center p-4 text-sm text-green-300 bg-green-900/50 rounded-lg">
          <CheckCircleIcon className="w-5 h-5 mr-3" />
          {successMessage}
        </div>
      )}

      {selectedProductIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-sky-900/50 rounded-lg animate-fade-in">
          <span className="font-semibold text-sky-200">{selectedProductIds.size} selected</span>
          <button
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            <Trash2Icon className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {products.map((p) => (
          <div
            key={p.id}
            className={`w-full rounded-2xl p-4 shadow-md border text-gray-200 transition-colors ${selectedProductIds.has(p.id) ? 'bg-sky-900/60 border-sky-700' : 'bg-[#0d1b2a] border-slate-700'}`}
          >
            <div className="flex gap-4">
              <input
                type="checkbox"
                onChange={() => handleSelectProduct(p.id)}
                checked={selectedProductIds.has(p.id)}
                className="mt-1 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-500"
              />
              <img
                src={
                  p.images?.[0]?.src ||
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNSAyMEMyMi4yNSAyMCAyMCAyMi4yNSAyMCAyNUMyMCAyNy43NSAyMi4yNSAzMCAyNSAzMEMyNy43NSAzMCAzMCAyNy43NSAzMCAyNUMzMCAyMi4yNSAyNy43NSAyMCAyNSAyMFoiIGZpbGw9IiM2QjcyODAiLz4KPHBhdGggZD0iTTE1IDM1TDIwIDMwTDI1IDM1TDMwIDMwTDM1IDM1SDE1WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'
                }
                alt={p.name}
                className="w-16 h-16 object-cover rounded-md bg-gray-700 flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNSAyMEMyMi4yNSAyMCAyMCAyMi4yNSAyMCAyNUMyMCAyNy43NSAyMi4yNSAzMCAyNSAzMEMyNy43NSAzMCAzMCAyNy43NSAzMCAyNUMzMCAyMi4yNSAyNy43NSAyMCAyNSAyMFoiIGZpbGw9IiM2QjcyODAiLz4KPHBhdGggZD0iTTE1IDM1TDIwIDMwTDI1IDM1TDMwIDMwTDM1IDM1SDE1WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white break-words">{p.name}</p>
                <p className="text-sm text-gray-400 break-all">SKU: {p.sku || 'N/A'}</p>
                <p className="text-xs text-gray-500 break-words">
                  {p.categories?.map((c, index) => c.name).join(', ') || 'Uncategorized'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-xs text-gray-400">Price</p>
                <p className="font-semibold text-white">
                  {selectedWebsite?.currency_symbol}
                  {p.regular_price}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Sale</p>
                <p className="font-semibold text-green-400">
                  {selectedWebsite?.currency_symbol}
                  {p.sale_price}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Stock</p>
                <p className="font-semibold text-sky-300">{p.stock_quantity ?? 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 flex justify-end gap-4">
              <button
                onClick={() => {
                  setProductToEdit(p);
                  setIsFormVisible(true);
                }}
                className="text-sky-400 hover:text-sky-300 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => setProductToDelete(p)}
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/50">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={allOnPageSelected}
                  className="rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-500"
                />
              </th>
              {[
                'Image',
                'SKU',
                'Name',
                'Categories',
                'Regular Price',
                'Sale Price',
                'Stock',
                'Actions',
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {products.map((p) => (
              <tr
                key={p.id}
                className={selectedProductIds.has(p.id) ? 'bg-sky-900/60' : 'hover:bg-gray-700/50'}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    onChange={() => handleSelectProduct(p.id)}
                    checked={selectedProductIds.has(p.id)}
                    className="rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={
                      p.images?.[0]?.src ||
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNSAyMEMyMi4yNSAyMCAyMCAyMi4yNSAyMCAyNUMyMCAyNy43NSAyMi4yNSAzMCAyNSAzMEMyNy43NSAzMCAzMCAyNy43NSAzMCAyNUMzMCAyMi4yNSAyNy43NSAyMCAyNSAyMFoiIGZpbGw9IiM2QjcyODAiLz4KPHBhdGggZD0iTTE1IDM1TDIwIDMwTDI1IDM1TDMwIDMwTDM1IDM1SDE1WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'
                    }
                    alt={p.name}
                    className="w-12 h-12 object-cover rounded-md bg-gray-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNSAyMEMyMi4yNSAyMCAyMCAyMi4yNSAyMCAyNUMyMCAyNy43NSAyMi4yNSAzMCAyNSAzMEMyNy43NSAzMCAzMCAyNy43NSAzMCAyNUMzMCAyMi4yNSAyNy43NSAyMCAyNSAyMFoiIGZpbGw9IiM2QjcyODAiLz4KPHBhdGggZD0iTTE1IDM1TDIwIDMwTDI1IDM1TDMwIDMwTDM1IDM1SDE1WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K';
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {p.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">
                  {p.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">
                  {p.categories?.map((c, index) => c.name).join(', ') || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {selectedWebsite?.currency_symbol}
                  {p.regular_price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                  {selectedWebsite?.currency_symbol}
                  {p.sale_price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-300">
                  {p.stock_quantity ?? 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setProductToEdit(p);
                      setIsFormVisible(true);
                    }}
                    className="text-sky-400 hover:text-sky-300 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setProductToDelete(p)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && products.length === 0 ? (
          <div className="text-center py-8">
            <SpinnerIcon className="w-6 h-6 mx-auto text-sky-400" />
          </div>
        ) : (
          products.length === 0 && (
            <p className="text-center text-gray-500 py-8">No products found.</p>
          )
        )}
      </div>

      <div className="flex justify-center items-center gap-4 pt-4">
        <button
          onClick={handleLoadMore}
          disabled={isLoading || !canLoadMore}
          className="flex items-center gap-2 bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <SpinnerIcon className="w-5 h-5" />
          ) : (
            <ArrowDownIcon className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Loading...' : 'Load More'}</span>
        </button>
      </div>

      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={
          <>
            Are you sure you want to permanently delete the product{' '}
            <strong>{productToDelete?.name}</strong>? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        isConfirming={isLoading}
      />
      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Bulk Delete Products"
        message={
          <>
            Are you sure you want to permanently delete{' '}
            <strong>{selectedProductIds.size} selected products</strong>? This action cannot be
            undone.
          </>
        }
        confirmText={`Delete ${selectedProductIds.size} Products`}
        isConfirming={isLoading}
      />
    </div>
  );
};

export default ProductManager;
