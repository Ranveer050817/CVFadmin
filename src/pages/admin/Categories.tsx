import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, X, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { CategoryWithStats } from '../../types';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentCategory, setCurrentCategory] = useState<CategoryWithStats | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (catError) throw catError;

      const { data: imgData, error: imgError } = await supabase
        .from('gallery_images')
        .select('category_id, image_url, created_at')
        .order('created_at', { ascending: false });
        
      if (imgError) throw imgError;

      const enrichedCategories = (catData || []).map((cat) => {
        const catImages = (imgData || []).filter(img => img.category_id === cat.id);
        return {
          ...cat,
          image_count: catImages.length,
          preview_image: catImages.length > 0 ? catImages[0].image_url : null
        };
      });

      setCategories(enrichedCategories);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentCategory(null);
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryWithStats) => {
    setCurrentCategory(category);
    setName(category.name || '');
    setIsModalOpen(true);
  };

  const openDeleteModal = (category: CategoryWithStats) => {
    setCurrentCategory(category);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentCategory(null);
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (currentCategory) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({ name: name.trim() })
          .eq('id', currentCategory.id);

        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        // Insert
        const { error } = await supabase
          .from('categories')
          .insert([{ name: name.trim() }]);

        if (error) throw error;
        toast.success('Category added successfully');
      }

      closeModals();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCategory) return;
    
    if (currentCategory.image_count > 0) {
      toast.error(`Cannot delete "${currentCategory.name}" because it is currently assigned to ${currentCategory.image_count} gallery images.`);
      closeModals();
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', currentCategory.id);

      if (error) throw error;

      toast.success('Category deleted successfully');
      closeModals();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 flex-grow flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Categories Management</h1>
          <p className="mt-1 text-sm text-gray-500">Organize your portfolio into collections.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          <Plus size={18} className="mr-2" />
          Add Category
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gold"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
            <FolderOpen size={32} className="text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No categories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search to find what you are looking for.' 
              : 'Get started by creating your first category.'}
          </p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Images
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          {category.preview_image ? (
                            <img src={category.preview_image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <FolderOpen size={18} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-light text-gold">
                        {category.image_count} {category.image_count === 1 ? 'image' : 'images'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => openEditModal(category)}
                          className="text-gray-400 hover:text-gold transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(category)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button 
                onClick={closeModals}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="E.g., Weddings"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete "{currentCategory.name}"? This action cannot be undone.
            </p>
            {currentCategory.image_count > 0 && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 text-left">
                <strong>Warning:</strong> This category is used by {currentCategory.image_count} images. Deletion will be blocked to prevent breaking your gallery.
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={closeModals}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || currentCategory.image_count > 0}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
