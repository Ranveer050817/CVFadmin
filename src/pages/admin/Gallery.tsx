import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Category, GalleryImage } from '../../types';

export const Gallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentImage, setCurrentImage] = useState<GalleryImage | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch images with category info
      const { data: imgData, error: imgError } = await supabase
        .from('gallery_images')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
        
      if (imgError) throw imgError;
      setImages(imgData || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentImage(null);
    setTitle('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (image: GalleryImage) => {
    setCurrentImage(image);
    setTitle(image.title || '');
    setCategoryId(image.category_id || '');
    setFile(null);
    setPreviewUrl(image.image_url);
    setIsModalOpen(true);
  };

  const openDeleteModal = (image: GalleryImage) => {
    setCurrentImage(image);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentImage(null);
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (!currentImage && !file) {
      toast.error('Please select an image to upload');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = currentImage?.image_url || '';

      // 1. Upload image if there's a new file
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = fileName; // Upload directly to the root of the bucket

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('gallery')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
        
        const { data } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);
          
        finalImageUrl = data.publicUrl;
      }

      // 2. Save to database
      if (currentImage) {
        // Update
        const { error } = await supabase
          .from('gallery_images')
          .update({
            title,
            category_id: categoryId,
            ...(file ? { image_url: finalImageUrl } : {})
          })
          .eq('id', currentImage.id);

        if (error) throw error;
        toast.success('Image updated successfully');
      } else {
        // Insert
        const { error } = await supabase
          .from('gallery_images')
          .insert([
            {
              title,
              category_id: categoryId,
              image_url: finalImageUrl,
            }
          ]);

        if (error) throw error;
        toast.success('Image added successfully');
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
    if (!currentImage) return;
    setIsSubmitting(true);
    try {
      // Delete from DB
      const { error: dbError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', currentImage.id);

      if (dbError) throw dbError;

      // Try to delete from storage (extract path from URL)
      try {
        const url = new URL(currentImage.image_url);
        const pathParts = url.pathname.split('/');
        // Supabase storage URLs usually look like: /storage/v1/object/public/bucketName/filePath...
        const publicIndex = pathParts.indexOf('public');
        if (publicIndex !== -1 && pathParts.length > publicIndex + 2) {
          const bucketName = pathParts[publicIndex + 1];
          const filePath = pathParts.slice(publicIndex + 2).join('/');
          await supabase.storage.from(bucketName).remove([filePath]);
        }
      } catch (storageErr) {
        console.warn('Could not delete file from storage', storageErr);
      }

      toast.success('Image deleted successfully');
      closeModals();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredImages = images.filter(img => {
    const matchesSearch = img.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          img.categories?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || img.category_id?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 flex-grow flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gallery Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your portfolio images and categories.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          <Plus size={18} className="mr-2" />
          Add Image
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-64 flex-shrink-0">
          <select
            className="block w-full rounded-lg border border-gray-200 py-2.5 px-3 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gold"></div>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
            <ImageIcon size={32} className="text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No images found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter to find what you are looking for.' 
              : 'Get started by adding some images to your gallery.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div key={image.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img
                  src={image.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={image.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center gap-3">
                  <button 
                    onClick={() => openEditModal(image)}
                    className="p-2 bg-white text-black rounded-full hover:bg-gold hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(image)}
                    className="p-2 bg-white text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate" title={image.title}>{image.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">{image.categories?.name || 'Uncategorized'}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider">
                  Added {new Date(image.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentImage ? 'Edit Image' : 'Add New Image'}
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Image Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="E.g., Sunset Wedding Portrait"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors bg-white"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Image File</label>
                  
                  {previewUrl ? (
                    <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(currentImage ? currentImage.image_url : '');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-gray-900 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 hover:border-gold hover:bg-gold-light/20 transition-colors"
                    >
                      <Upload size={24} className="text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Click to upload image</p>
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG or WEBP (Max 5MB)</p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
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
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Image'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Image</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete "{currentImage.title}"? This action cannot be undone.
            </p>
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
                disabled={isSubmitting}
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
