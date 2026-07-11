import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, X, Package as PackageIcon, Check, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { Package } from '../../types';

export const Packages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentPackage, setCurrentPackage] = useState<Package | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [displayOrder, setDisplayOrder] = useState<number | string>('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, ignore but show toast
          console.warn('Packages table not found, please run SQL migration');
          setPackages([]);
        } else {
          throw error;
        }
      } else {
        setPackages(data || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentPackage(null);
    setName('');
    setPrice('');
    setDescription('');
    setFeatures(['']);
    setDisplayOrder('');
    setIsFeatured(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: Package) => {
    setCurrentPackage(pkg);
    setName(pkg.name || '');
    setPrice(pkg.price || '');
    setDescription(pkg.description || '');
    setFeatures(pkg.features && pkg.features.length > 0 ? pkg.features : ['']);
    setDisplayOrder(pkg.display_order ?? '');
    setIsFeatured(pkg.is_featured ?? false);
    setIsActive(pkg.is_active ?? true);
    setIsModalOpen(true);
  };

  const openDeleteModal = (pkg: Package) => {
    setCurrentPackage(pkg);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentPackage(null);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      const newFeatures = [...features];
      newFeatures.splice(index, 1);
      setFeatures(newFeatures);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Package name is required');
      return;
    }

    if (!price.trim()) {
      toast.error('Price is required');
      return;
    }

    const cleanFeatures = features.filter(f => f.trim() !== '');

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        price: price.trim(),
        description: description.trim() || null,
        features: cleanFeatures,
        display_order: displayOrder !== '' ? Number(displayOrder) : null,
        is_featured: isFeatured,
        is_active: isActive
      };

      if (currentPackage) {
        // Update
        const { error } = await supabase
          .from('packages')
          .update(payload)
          .eq('id', currentPackage.id);

        if (error) throw error;
        toast.success('Package updated successfully');
      } else {
        // Insert
        const { error } = await supabase
          .from('packages')
          .insert([payload]);

        if (error) throw error;
        toast.success('Package added successfully');
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
    if (!currentPackage) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', currentPackage.id);

      if (error) throw error;

      toast.success('Package deleted successfully');
      closeModals();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPackages = packages.filter(pkg => 
    pkg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 flex-grow flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Packages Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your pricing plans and packages.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          <Plus size={18} className="mr-2" />
          Add Package
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
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gold"></div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
            <PackageIcon size={32} className="text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No packages found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search to find what you are looking for.' 
              : 'Get started by adding your first package.'}
          </p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Order
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {pkg.name}
                          {pkg.is_featured && <Star size={14} className="ml-2 text-gold fill-gold" />}
                        </div>
                        <div className="text-sm text-gray-500 hidden md:block truncate max-w-xs">{pkg.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{pkg.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className="text-sm text-gray-500">
                        {pkg.display_order ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => openEditModal(pkg)}
                          className="text-gray-400 hover:text-gold transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(pkg)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentPackage ? 'Edit Package' : 'Add New Package'}
              </h3>
              <button 
                onClick={closeModals}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Package Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="E.g., Complete Wedding Package"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="E.g., $2,500 or Starting at $1,500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="E.g., 1, 2, 3..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Short Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors resize-none"
                    placeholder="Brief description of the package..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Features</label>
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-grow relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Check size={14} className="text-gold" />
                          </div>
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            className="block w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                            placeholder={`Feature ${index + 1}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          disabled={features.length === 1}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="mt-3 inline-flex items-center text-sm font-medium text-gold hover:text-gold-dark transition-colors"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Feature
                  </button>
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 border-t border-gray-100 pt-5 mt-2">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${isFeatured ? 'bg-gold' : 'bg-gray-200'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isFeatured ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-medium text-gray-700">
                      Featured Package
                      <p className="text-xs text-gray-500 font-normal">Highlight this package</p>
                    </div>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-medium text-gray-700">
                      Active
                      <p className="text-xs text-gray-500 font-normal">Visible to customers</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-100">
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
                  {isSubmitting ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Package</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete "{currentPackage.name}"? This action cannot be undone.
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
