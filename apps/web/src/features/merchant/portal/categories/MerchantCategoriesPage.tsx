'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Plus,
  Search,
  ArrowLeft,
  Edit2,
  Trash2,
  Tag,
  Package,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useMerchant } from '../MerchantContext';
import { MerchantCategoryItem, MerchantSubcategoryItem } from '../types';

export function MerchantCategoriesPage() {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useMerchant();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatSubtags, setNewCatSubtags] = useState<string[]>([]);
  const [subtagInput, setSubtagInput] = useState('');

  const [editingCategory, setEditingCategory] = useState<MerchantCategoryItem | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  const [activeSubcatModalCat, setActiveSubcatModalCat] = useState<MerchantCategoryItem | null>(null);
  const [subcatModalMode, setSubcatModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingSubcat, setEditingSubcat] = useState<MerchantSubcategoryItem | null>(null);
  const [subcatName, setSubcatName] = useState('');
  const [subcatDesc, setSubcatDesc] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'CATEGORY' | 'SUBCATEGORY';
    categoryId: string;
    subcategoryId?: string;
    title: string;
  } | null>(null);

  // Quick inline subcategory input per category
  const [inlineSubcatInputs, setInlineSubcatInputs] = useState<Record<string, string>>({});

  // Product counts per category & subcategory
  const productCountMap = useMemo(() => {
    const catMap: Record<string, number> = {};
    const subMap: Record<string, number> = {};

    products.forEach((p) => {
      const catKey = (p.category || '').toLowerCase().trim();
      const subKey = `${catKey}:::${(p.subcategory || '').toLowerCase().trim()}`;
      if (catKey) catMap[catKey] = (catMap[catKey] || 0) + 1;
      if (p.subcategory) subMap[subKey] = (subMap[subKey] || 0) + 1;
    });

    return { catMap, subMap };
  }, [products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;

    return categories.filter((c) => {
      const matchCat =
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);
      const matchSub = c.subcategories.some(
        (s: MerchantSubcategoryItem) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q)
      );
      return matchCat || matchSub;
    });
  }, [categories, searchQuery]);

  // Stats
  const totalCategories = categories.length;
  const totalSubcategories = useMemo(
    () => categories.reduce((acc: number, c: MerchantCategoryItem) => acc + (c.subcategories?.length || 0), 0),
    [categories]
  );
  const totalProducts = products.length;

  const toggleExpand = (catId: string) => {
    setExpandedCatIds((prev) => ({
      ...prev,
      [catId]: prev[catId] === false ? true : false, // default true
    }));
  };

  const isExpanded = (catId: string) => {
    return expandedCatIds[catId] !== false; // default open
  };

  // Handlers for Add Category Modal
  const handleOpenAddCatModal = () => {
    setNewCatName('');
    setNewCatDesc('');
    setNewCatSubtags([]);
    setSubtagInput('');
    setIsAddCatModalOpen(true);
  };

  const handleAddSubtag = () => {
    const trimmed = subtagInput.trim();
    if (trimmed && !newCatSubtags.includes(trimmed)) {
      setNewCatSubtags([...newCatSubtags, trimmed]);
      setSubtagInput('');
    }
  };

  const handleRemoveSubtag = (tag: string) => {
    setNewCatSubtags(newCatSubtags.filter((t) => t !== tag));
  };

  const handleSubmitNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim() || undefined,
      subcategories: newCatSubtags,
    });

    setIsAddCatModalOpen(false);
  };

  // Handlers for Edit Category
  const handleOpenEditCatModal = (cat: MerchantCategoryItem) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
  };

  const handleSaveEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;

    updateCategory(editingCategory.id, {
      name: editCatName.trim(),
      description: editCatDesc.trim() || undefined,
    });

    setEditingCategory(null);
  };

  // Handlers for Subcategory Modal
  const handleOpenAddSubcatModal = (cat: MerchantCategoryItem) => {
    setActiveSubcatModalCat(cat);
    setSubcatModalMode('ADD');
    setEditingSubcat(null);
    setSubcatName('');
    setSubcatDesc('');
  };

  const handleOpenEditSubcatModal = (
    cat: MerchantCategoryItem,
    sub: MerchantSubcategoryItem
  ) => {
    setActiveSubcatModalCat(cat);
    setSubcatModalMode('EDIT');
    setEditingSubcat(sub);
    setSubcatName(sub.name);
    setSubcatDesc(sub.description || '');
  };

  const handleSaveSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubcatModalCat || !subcatName.trim()) return;

    if (subcatModalMode === 'ADD') {
      addSubcategory(activeSubcatModalCat.id, {
        name: subcatName.trim(),
        description: subcatDesc.trim() || undefined,
      });
    } else if (editingSubcat) {
      updateSubcategory(activeSubcatModalCat.id, editingSubcat.id, {
        name: subcatName.trim(),
        description: subcatDesc.trim() || undefined,
      });
    }

    setActiveSubcatModalCat(null);
    setEditingSubcat(null);
  };

  // Inline subcategory quick add
  const handleQuickInlineAddSubcat = (catId: string) => {
    const val = (inlineSubcatInputs[catId] || '').trim();
    if (!val) return;

    addSubcategory(catId, { name: val });
    setInlineSubcatInputs((prev) => ({ ...prev, [catId]: '' }));
  };

  // Confirm delete
  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'CATEGORY') {
      deleteCategory(deleteConfirm.categoryId);
    } else if (deleteConfirm.type === 'SUBCATEGORY' && deleteConfirm.subcategoryId) {
      deleteSubcategory(deleteConfirm.categoryId, deleteConfirm.subcategoryId);
    }

    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/merchant/products"
              className="hover:text-orange-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Products</span>
            </Link>
            <span>/</span>
            <span className="text-orange-600 dark:text-orange-400 font-bold">Categories</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white flex items-center gap-2.5">
            <FolderTree className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            <span>Product Categories &amp; Sub-categories</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your store&apos;s product taxonomy. Categories and sub-categories defined here are automatically selectable when creating or editing products.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/merchant/products/new"
            className="px-4 py-2.5 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Package className="h-4 w-4 text-emerald-500" />
            <span>Add Product</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenAddCatModal}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Categories
            </span>
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {totalCategories}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <FolderTree className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Sub-categories
            </span>
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {totalSubcategories}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Products in Catalog
            </span>
            <div className="text-2xl font-black text-navy-900 dark:text-white">
              {totalProducts}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900/70 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category or sub-category name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredCategories.length} of {categories.length} categories
            </span>
          </div>
        </div>

        {/* Categories Tree List */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/40">
            <FolderTree className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-navy-900 dark:text-slate-200">
              No categories found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No categories or sub-categories match your search query.'
                : 'Get started by creating your first product category.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={handleOpenAddCatModal}
                className="mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Category</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((cat) => {
              const open = isExpanded(cat.id);
              const linkedCatProds =
                productCountMap.catMap[cat.name.toLowerCase().trim()] || 0;

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/60 overflow-hidden transition-all shadow-xs"
                >
                  {/* Category Header Card */}
                  <div className="p-4 sm:p-4.5 bg-white dark:bg-navy-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10">
                    <div className="flex items-start sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(cat.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 transition-colors mt-0.5 sm:mt-0"
                        title={open ? 'Collapse sub-categories' : 'Expand sub-categories'}
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-navy-900 dark:text-white">
                            {cat.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                            /{cat.slug}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                            {cat.subcategories.length} Sub-categories
                          </span>
                          {linkedCatProds > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span>{linkedCatProds} Products</span>
                            </span>
                          )}
                        </div>
                        {cat.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenAddSubcatModal(cat)}
                        className="px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-xs font-bold flex items-center gap-1 transition-colors border border-orange-500/20 cursor-pointer"
                        title="Add Sub-category under this category"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Sub-category</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditCatModal(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'CATEGORY',
                            categoryId: cat.id,
                            title: `Category "${cat.name}" and its sub-categories`,
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-categories Accordion Content */}
                  {open && (
                    <div className="p-4 space-y-3.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Sub-categories ({cat.subcategories.length})</span>
                        <span className="text-[11px] font-normal lowercase text-slate-400">
                          Selectable in product form
                        </span>
                      </div>

                      {/* Sub-categories Grid */}
                      {cat.subcategories.length === 0 ? (
                        <div className="text-xs text-slate-400 italic py-2">
                          No sub-categories yet under {cat.name}. Add one below.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {cat.subcategories.map((sub: MerchantSubcategoryItem) => {
                            const subKey = `${cat.name.toLowerCase().trim()}:::${sub.name.toLowerCase().trim()}`;
                            const linkedSubProds = productCountMap.subMap[subKey] || 0;

                            return (
                              <div
                                key={sub.id}
                                className="group p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-2xs hover:border-orange-500/40 transition-all flex items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                    <span className="text-xs font-bold text-navy-900 dark:text-slate-200 truncate">
                                      {sub.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="font-mono">/{sub.slug}</span>
                                    {linkedSubProds > 0 && (
                                      <span className="text-emerald-500 font-semibold">
                                        • {linkedSubProds} prods
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSubcatModal(cat, sub)}
                                    className="p-1 rounded text-slate-400 hover:text-navy-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                                    title="Edit sub-category"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteConfirm({
                                        type: 'SUBCATEGORY',
                                        categoryId: cat.id,
                                        subcategoryId: sub.id,
                                        title: `Sub-category "${sub.name}"`,
                                      })
                                    }
                                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                    title="Delete sub-category"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick inline subcategory add form */}
                      <div className="pt-2 flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          value={inlineSubcatInputs[cat.id] || ''}
                          onChange={(e) =>
                            setInlineSubcatInputs({
                              ...inlineSubcatInputs,
                              [cat.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickInlineAddSubcat(cat.id);
                            }
                          }}
                          placeholder={`+ Add sub-category to ${cat.name} (e.g. Graphic Tee)...`}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickInlineAddSubcat(cat.id)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Add New Category */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2 text-navy-900 dark:text-white font-bold">
                <FolderTree className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-bold">Create New Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CATEGORY NAME <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Winter Wear, Gadgets, Formal Attire..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of products belonging to this category..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Initial Subcategories tags */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  INITIAL SUB-CATEGORIES
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subtagInput}
                    onChange={(e) => setSubtagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtag();
                      }
                    }}
                    placeholder="Type sub-category and press Add (e.g. Hoodie, Zipper)..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtag}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-xs font-bold rounded-lg text-navy-900 dark:text-slate-200 transition-colors"
                  >
                    Add Tag
                  </button>
                </div>

                {newCatSubtags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {newCatSubtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold border border-orange-500/20"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtag(tag)}
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Category */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Edit Category
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CATEGORY NAME
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Sub-category Modal */}
      {activeSubcatModalCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  {subcatModalMode === 'ADD'
                    ? 'Add Sub-category'
                    : 'Edit Sub-category'}
                </h3>
                <span className="text-xs text-slate-400">
                  Under: <strong className="text-orange-500">{activeSubcatModalCat.name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSubcatModalCat(null);
                  setEditingSubcat(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SUB-CATEGORY NAME <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subcatName}
                  onChange={(e) => setSubcatName(e.target.value)}
                  placeholder="e.g. Pullover Hoodie, Graphic Tee, Smart Band..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={subcatDesc}
                  onChange={(e) => setSubcatDesc(e.target.value)}
                  placeholder="Additional details about this subcategory..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubcatModalCat(null);
                    setEditingSubcat(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  {subcatModalMode === 'ADD' ? 'Add Sub-category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                  Confirm Deletion
                </h4>
                <p className="text-xs text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong>{deleteConfirm.title}</strong>? Existing products with this tag will retain their values until updated.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
