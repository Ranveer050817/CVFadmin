import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, X, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { Service } from '../../types';

export const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentService, setCurrentService] = useState<Service | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentService(null);
    setTitle('');
    setShortDescription('');
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setCurrentService(service);
    setTitle(service.title || '');
    setShortDescription(service.short_description || '');
    setImageFile(null);
    setImagePreview(service.image_url || null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP images are allowed');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openDeleteModal = (service: Service) => {
    setCurrentService(service);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Service title is required');
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = currentService?.image_url || null;

    try {
      if (imageFile) {
        toast.loading('Uploading image...', { id: 'upload-toast' });
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, imageFile, {
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
        toast.success('Image uploaded', { id: 'upload-toast' });
      } else if (!imagePreview && finalImageUrl) {
        finalImageUrl = null;
      }

      const payload = {
        title: title.trim(),
        short_description: shortDescription.trim() || null,
        image_url: finalImageUrl
      };

      if (currentService) {
        // Update
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', currentService.id);

        if (error) throw error;
        toast.success('Service updated successfully');
      } else {
        // Insert
        const { error } = await supabase
          .from('services')
          .insert([payload]);

        if (error) throw error;
        toast.success('Service added successfully');
      }

      closeModals();
      fetchData();
    } catch (error: any) {
      toast.dismiss('upload-toast');
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentService) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', currentService.id);

      if (error) throw error;

      toast.success('Service deleted successfully');
      closeModals();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = services.filter(service => 
    service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 flex-grow flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Services Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage the services you offer to clients.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          <Plus size={18} className="mr-2" />
          Add Service
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
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gold"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
            <Briefcase size={32} className="text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search to find what you are looking for.' 
              : 'Get started by adding your first service.'}
          </p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Service Title
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center text-gold">
                          {service.image_url ? (
                            <img src={service.image_url} alt="" className="h-full w-full object-cover" />
                          ) : service.icon ? (
                            <img src={service.icon} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Briefcase size={20} />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{service.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 max-w-xs truncate">
                      {service.short_description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {service.created_at ? new Date(service.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => openEditModal(service)}
                          className="text-gray-400 hover:text-gold transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(service)}
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
                {currentService ? 'Edit Service' : 'Add New Service'}
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">Service Image</label>
                  {imagePreview ? (
                    <div className="relative h-40 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gold hover:bg-gold-light/10"
                    >
                      <Briefcase size={28} className="text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600">Click to upload image</span>
                      <span className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP up to 5MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Service Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="E.g., Cinematic Wedding Story"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Short Description</label>
                  <textarea
                    rows={3}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors resize-none"
                    placeholder="Brief description of the service..."
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
                  {isSubmitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Service</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete "{currentService.title}"? This action cannot be undone.
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
