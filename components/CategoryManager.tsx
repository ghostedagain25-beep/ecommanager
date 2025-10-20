import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/api';
import * as wooApi from '../services/wooCommerceApi';
import type { User, Website } from '../types/index';
import type { WooCommerceProductCategory } from '../types/woocommerce';
import { SpinnerIcon, ExclamationIcon, UserIcon, ArrowLeftIcon, WordPressIcon, PlusCircleIcon, SearchIcon, CheckCircleIcon, Trash2Icon } from './icons';
import CategoryForm from './CategoryForm';
import CategoryList from './CategoryList';
import { useAuth } from '../context/AuthContext';
import { useWebsite } from '../context/WebsiteContext';
import { ConfirmationModal } from './ui/ConfirmationModal';

type ViewState = 'select_user' | 'show_categories';

interface HierarchicalCategory extends WooCommerceProductCategory {
    children: HierarchicalCategory[];
}

const ITEMS_PER_PAGE = 20;

const CategoryManager: React.FC<{ isAdminView?: boolean }> = ({ isAdminView = false }) => {
    const { user: loggedInUser } = useAuth();
    const { 
        websites, 
        selectedWebsite, 
        selectedUser, 
        isLoading: websiteLoading, 
        error: websiteError,
        setSelectedWebsite, 
        setSelectedUser 
    } = useWebsite();

    const [viewState, setViewState] = useState<ViewState>(isAdminView ? 'select_user' : 'show_categories');
    const [users, setUsers] = useState<User[]>([]);
    
    const [categories, setCategories] = useState<WooCommerceProductCategory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<WooCommerceProductCategory | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<WooCommerceProductCategory | null>(null);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (isAdminView && viewState === 'select_user') {
            const loadUsers = async () => {
                setIsLoading(true);
                try {
                    const allUsers = await api.getUsers();
                    setUsers(allUsers.filter(u => u.role === 'user'));
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
    
    const fetchCategories = useCallback(async () => {
        if (!selectedWebsite) {
            setCategories([]);
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            // FIX: The `fetchWooCommerceProductCategories` function expects a `Website` object, not separate credentials.
            const fetchedCategories = await wooApi.fetchWooCommerceProductCategories(
                selectedWebsite
            );
            setCategories(fetchedCategories);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch categories.');
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedWebsite]);

    useEffect(() => {
        if (selectedWebsite) {
            setSelectedCategoryIds(new Set());
            setSearchTerm('');
            setCurrentPage(1);
            fetchCategories();
        }
    }, [selectedWebsite, fetchCategories]);
    
    const categoryMap = useMemo(() => {
        const map = new Map<number, WooCommerceProductCategory>();
        categories.forEach(cat => map.set(cat.id, cat));
        return map;
    }, [categories]);

    const childrenMap = useMemo(() => {
        const map = new Map<number, number[]>();
        categories.forEach(cat => {
            if (cat.parent) {
                if (!map.has(cat.parent)) {
                    map.set(cat.parent, []);
                }
                map.get(cat.parent)!.push(cat.id);
            }
        });
        return map;
    }, [categories]);

    const hierarchicalCategories = useMemo((): HierarchicalCategory[] => {
        const categoryNodeMap = new Map<number, HierarchicalCategory>();
        const rootCategories: HierarchicalCategory[] = [];
        categories.forEach(cat => categoryNodeMap.set(cat.id, { ...cat, children: [] }));
        categories.forEach(cat => {
            const hierarchicalCat = categoryNodeMap.get(cat.id)!;
            if (cat.parent && categoryNodeMap.has(cat.parent)) {
                categoryNodeMap.get(cat.parent)!.children.push(hierarchicalCat);
            } else {
                rootCategories.push(hierarchicalCat);
            }
        });
        categoryNodeMap.forEach(cat => cat.children.sort((a, b) => a.name.localeCompare(b.name)));
        rootCategories.sort((a, b) => a.name.localeCompare(b.name));
        return rootCategories;
    }, [categories]);

    const filteredHierarchicalCategories = useMemo((): HierarchicalCategory[] => {
        if (!searchTerm.trim()) return hierarchicalCategories;
        const lowercasedFilter = searchTerm.toLowerCase();
        function filterAndExpand(nodes: HierarchicalCategory[]): HierarchicalCategory[] {
            let result: HierarchicalCategory[] = [];
            for (const node of nodes) {
                const isMatch = node.name.toLowerCase().includes(lowercasedFilter);
                const filteredChildren = filterAndExpand(node.children);
                if (isMatch || filteredChildren.length > 0) {
                    result.push({ ...node, children: isMatch ? node.children : filteredChildren });
                }
            }
            return result;
        }
        return filterAndExpand(hierarchicalCategories);
    }, [hierarchicalCategories, searchTerm]);

    const { paginatedCategories, totalPages } = useMemo(() => {
        const totalItems = filteredHierarchicalCategories.length;
        const totalPagesCalc = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = filteredHierarchicalCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return { paginatedCategories: paginated, totalPages: totalPagesCalc > 0 ? totalPagesCalc : 1 };
    }, [filteredHierarchicalCategories, currentPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);


    const handleUserSelect = (userToSelect: User) => {
        setSelectedUser(userToSelect);
        setViewState('show_categories');
    };

    const handleWebsiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const websiteId = e.target.value;
        const newWebsite = websites.find(w => w.id.toString() === websiteId);
        if (newWebsite) setSelectedWebsite(newWebsite);
    };
    
    const handleBackToUsers = () => {
        setError(null);
        setCategories([]);
        setSelectedUser(null);
        setSelectedWebsite(null);
        setViewState('select_user');
    };

    const handleSaveCategory = async (categoryData: Partial<WooCommerceProductCategory>) => {
        if (!selectedWebsite) return;
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            if (categoryToEdit?.id) {
                // FIX: The `updateWooCommerceCategory` function expects a `Website` object, not separate credentials.
                await wooApi.updateWooCommerceCategory(selectedWebsite, categoryToEdit.id, categoryData);
                setSuccessMessage(`Category "${categoryData.name}" updated successfully.`);
            } else {
                // FIX: The `createWooCommerceCategory` function expects a `Website` object, not separate credentials.
                await wooApi.createWooCommerceCategory(selectedWebsite, categoryData as any);
                setSuccessMessage(`Category "${categoryData.name}" created successfully.`);
            }
            setIsFormVisible(false);
            setCategoryToEdit(null);
            fetchCategories();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save category.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete || !selectedWebsite) return;
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            // FIX: The `deleteWooCommerceCategory` function expects a `Website` object, not separate credentials.
            await wooApi.deleteWooCommerceCategory(selectedWebsite, categoryToDelete.id);
            setSuccessMessage(`Category deleted successfully.`);
            fetchCategories();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete category.');
        } finally {
            setIsLoading(false);
            setCategoryToDelete(null);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedWebsite || selectedCategoryIds.size === 0) return;
        
        setIsBulkDeleteModalOpen(false);
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            // FIX: The `batchDeleteWooCommerceCategories` function expects a `Website` object, not separate credentials.
            const { deletedCount, errorDetails } = await wooApi.batchDeleteWooCommerceCategories(selectedWebsite, Array.from(selectedCategoryIds));
            let messages = [];
            if (deletedCount > 0) messages.push(`${deletedCount} categories deleted successfully.`);
            if (errorDetails.length > 0) messages.push(`${errorDetails.length} deletions failed.`);
            setSuccessMessage(messages.join(' '));
            if (errorDetails.length > 0) setError(`Failed to delete some categories.`);
            setSelectedCategoryIds(new Set());
            fetchCategories();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bulk deletion failed.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEditCategory = (category: WooCommerceProductCategory) => {
        setCategoryToEdit(category);
        setIsFormVisible(true);
        setError(null);
        setSuccessMessage(null);
    };

    const handleAddNew = () => {
        setCategoryToEdit(null);
        setIsFormVisible(true);
        setError(null);
        setSuccessMessage(null);
    };
    
    const handleSelectCategory = useCallback((categoryId: number) => {
        const getAllDescendantIds = (id: number): number[] => {
            const children = childrenMap.get(id) || [];
            return children.reduce((acc, childId) => [...acc, childId, ...getAllDescendantIds(childId)], [] as number[]);
        };

        setSelectedCategoryIds(prevSelectedIds => {
            const newSelectedIds = new Set(prevSelectedIds);
            const isSelecting = !newSelectedIds.has(categoryId);

            if (isSelecting) {
                // Select the item and all its descendants
                const idsToSelect = [categoryId, ...getAllDescendantIds(categoryId)];
                idsToSelect.forEach(id => newSelectedIds.add(id));

                // Check ancestors to see if they should now be selected
                let parentId = categoryMap.get(categoryId)?.parent;
                while (parentId && parentId !== 0) {
                    const siblingIds = childrenMap.get(parentId) || [];
                    const allSiblingsSelected = siblingIds.every(siblingId => newSelectedIds.has(siblingId));
                    if (allSiblingsSelected) {
                        newSelectedIds.add(parentId);
                        parentId = categoryMap.get(parentId)?.parent;
                    } else {
                        break; // Stop climbing up
                    }
                }
            } else {
                // Deselect the item, all its descendants, and all its ancestors
                const idsToDeselect = [categoryId, ...getAllDescendantIds(categoryId)];
                
                const getAncestorIds = (id: number): number[] => {
                    const parent = categoryMap.get(id)?.parent;
                    if (!parent || parent === 0) return [];
                    return [parent, ...getAncestorIds(parent)];
                };
                const ancestorIds = getAncestorIds(categoryId);
                
                [...idsToDeselect, ...ancestorIds].forEach(id => newSelectedIds.delete(id));
            }

            return newSelectedIds;
        });
    }, [categoryMap, childrenMap]);

    const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const getAllIdsOnPage = (nodes: HierarchicalCategory[]): number[] =>
            nodes.flatMap(node => [node.id, ...getAllIdsOnPage(node.children)]);
        const idsOnThisPage = new Set(getAllIdsOnPage(paginatedCategories));

        if (e.target.checked) {
            setSelectedCategoryIds(prev => new Set([...prev, ...idsOnThisPage]));
        } else {
            setSelectedCategoryIds(prev => {
                const newSet = new Set(prev);
                idsOnThisPage.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    };
    
    if (isAdminView && viewState === 'select_user') {
        return (
            <div className="animate-fade-in">
                <header className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-white">Select a User to Manage Categories</h2>
                </header>
                {isLoading && <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8 text-sky-400" /></div>}
                {error && <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg mb-4"><ExclamationIcon className="w-5 h-5 mr-3"/>{error}</div>}
                {users.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map(item => (
                            <button key={item.username} onClick={() => handleUserSelect(item)} className="bg-slate-800 p-6 rounded-lg text-left hover:bg-slate-700/80 border border-slate-700 hover:border-sky-500 transition-all transform hover:scale-105">
                                <div className="flex items-center gap-4">
                                    <UserIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-lg text-white">{item.username}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : !isLoading && (
                    <div className="text-center py-10 bg-slate-900/50 rounded-lg"><UserIcon className="w-12 h-12 mx-auto text-gray-500"/><h3 className="mt-2 text-lg font-medium text-white">No users found</h3></div>
                )}
            </div>
        );
    }
    
     if (viewState === 'show_categories' && !selectedWebsite) {
        return (
            <div className="animate-fade-in text-center">
                {isAdminView && (
                     <button onClick={handleBackToUsers} className="flex items-center gap-2 mb-6 text-sm text-gray-400 hover:text-white mx-auto">
                        <ArrowLeftIcon className="w-4 h-4"/> Back to User Selection
                     </button>
                )}
                <div className="py-10 bg-slate-900/50 rounded-lg">
                    <WordPressIcon className="w-12 h-12 mx-auto text-gray-500"/>
                    <h3 className="mt-2 text-lg font-medium text-white">No websites configured</h3>
                    <p className="mt-1 text-sm text-gray-400">{isAdminView ? 'This user does not have any websites set up.' : 'Please go to Settings to add a new website.'}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in space-y-6">
             {isFormVisible && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg">
                        <CategoryForm
                            category={categoryToEdit}
                            allCategories={categories}
                            onSave={handleSaveCategory}
                            onCancel={() => setIsFormVisible(false)}
                            isSaving={isSaving}
                        />
                    </div>
                </div>
            )}
            <div>
                 {isAdminView && (
                    <button onClick={handleBackToUsers} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-2">
                        <ArrowLeftIcon className="w-4 h-4"/> Back to User Selection
                    </button>
                )}
                <h1 className="text-3xl font-bold text-white tracking-tight">Category Management</h1>
                <p className="text-gray-400">
                    {isAdminView ? `Managing categories for ${selectedUser?.username} on ` : 'Managing your categories on '}
                    <span className="text-sky-400">{selectedWebsite?.name}</span>
                </p>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                 <div className="relative flex-grow w-full md:w-auto">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-gray-400" /></span>
                    <input 
                        type="text" 
                        placeholder="Search categories..." 
                        className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {websites.length > 1 && (
                        <select
                            id="website-select"
                            value={selectedWebsite?.id || ''}
                            onChange={handleWebsiteChange}
                            className="bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500 w-full"
                        >
                            {websites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                        </select>
                    )}
                     <button onClick={handleAddNew} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white w-full justify-center md:w-auto">
                        <PlusCircleIcon className="w-5 h-5"/> Add Category
                    </button>
                </div>
            </div>

            {error && <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"><ExclamationIcon className="w-5 h-5 mr-3"/>{error}</div>}
            {successMessage && <div className="flex items-center p-4 text-sm text-green-300 bg-green-900/50 rounded-lg"><CheckCircleIcon className="w-5 h-5 mr-3"/>{successMessage}</div>}
            
            {selectedCategoryIds.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-sky-900/50 rounded-lg animate-fade-in">
                    <span className="font-semibold text-sky-200">{selectedCategoryIds.size} selected</span>
                    <button onClick={() => setIsBulkDeleteModalOpen(true)} className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md">
                        <Trash2Icon className="w-4 h-4" />
                        Delete Selected
                    </button>
                </div>
            )}
            
            {isLoading ? (
                <div className="text-center py-8"><SpinnerIcon className="w-6 h-6 mx-auto text-sky-400" /></div>
            ) : (
                <CategoryList
                    categories={paginatedCategories}
                    selectedIds={selectedCategoryIds}
                    onEdit={handleEditCategory}
                    onDelete={(category) => setCategoryToDelete(category)}
                    onSelect={handleSelectCategory}
                    onSelectAll={handleSelectAllOnPage}
                />
            )}
            
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50">Prev</button>
                    <span className="text-gray-400">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50">Next</button>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={handleDeleteCategory}
                title="Delete Category"
                message={<>Are you sure you want to delete the category <strong>{categoryToDelete?.name}</strong>? This action cannot be undone.</>}
                confirmText="Delete"
                isConfirming={isLoading}
            />

            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Categories"
                message={<>Are you sure you want to delete <strong>{selectedCategoryIds.size} selected categories</strong>? This action cannot be undone.</>}
                confirmText={`Delete ${selectedCategoryIds.size} Categories`}
                isConfirming={isLoading}
            />
        </div>
    );
};

export default CategoryManager;