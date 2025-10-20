import React from 'react';
// FIX: Update import path for types.
import type { WooCommerceProductCategory } from '../../types/woocommerce';

interface HierarchicalCategory extends WooCommerceProductCategory {
    children: HierarchicalCategory[];
}

interface CategoryListProps {
    categories: HierarchicalCategory[];
    selectedIds: Set<number>;
    onEdit: (category: WooCommerceProductCategory) => void;
    onDelete: (category: WooCommerceProductCategory) => void;
    onSelect: (categoryId: number) => void;
    onSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CategoryItem: React.FC<{
    category: HierarchicalCategory,
    selectedIds: Set<number>,
    onEdit: (c: WooCommerceProductCategory) => void,
    onDelete: (c: WooCommerceProductCategory) => void,
    onSelect: (id: number) => void,
    level: number
}> = ({ category, selectedIds, onEdit, onDelete, onSelect, level }) => {
    const isSelected = selectedIds.has(category.id);
    return (
        <div>
            <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isSelected ? 'bg-sky-900/60' : 'bg-gray-800 hover:bg-gray-700/50'}`}>
                <div className="flex items-center flex-grow" style={{ paddingLeft: `${level * 24}px` }}>
                    {level > 0 && <span className="text-gray-500 mr-2">└─</span>}
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(category.id)}
                        className="mr-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-500"
                    />
                    <div className="flex-grow">
                        <p className="font-semibold text-white">{category.name}</p>
                        {category.description && <p className="text-sm text-gray-400 truncate max-w-md">{category.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                     <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-1 rounded-md">{category.count} items</span>
                     <button onClick={() => onEdit(category)} className="text-sky-400 hover:text-sky-300 text-sm font-medium">Edit</button>
                     <button onClick={() => onDelete(category)} className="text-red-400 hover:text-red-300 text-sm font-medium">Delete</button>
                </div>
            </div>
             {category.children.length > 0 && (
                <div className="mt-2 space-y-2">
                    {category.children.map(child => (
                        <CategoryItem key={child.id} category={child} selectedIds={selectedIds} onEdit={onEdit} onDelete={onDelete} onSelect={onSelect} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};


const CategoryList: React.FC<CategoryListProps> = ({ categories, selectedIds, onEdit, onDelete, onSelect, onSelectAll }) => {
    
    if (categories.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-700">
                <i data-lucide="folder-search" className="w-12 h-12 mx-auto text-gray-500"></i>
                <h3 className="mt-2 text-lg font-medium text-white">No Categories Found</h3>
                <p className="mt-1 text-sm text-gray-400">Your search returned no results, or no categories exist yet.</p>
            </div>
        );
    }

    const getAllIds = (nodes: HierarchicalCategory[]): number[] =>
        nodes.flatMap(node => [node.id, ...getAllIds(node.children)]);

    const allVisibleIds = getAllIds(categories);
    const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));
    
    return (
        <div className="space-y-2">
            <div className="flex items-center p-3 bg-gray-900/50 rounded-lg">
                <input
                    type="checkbox"
                    onChange={onSelectAll}
                    checked={allSelected}
                    className="mr-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-500"
                />
                <span className="text-sm font-semibold text-gray-300">Select All Visible</span>
            </div>
            {categories.map(category => (
                <CategoryItem
                    key={category.id}
                    category={category}
                    selectedIds={selectedIds}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSelect={onSelect}
                    level={0}
                />
            ))}
        </div>
    );
};

export default CategoryList;
