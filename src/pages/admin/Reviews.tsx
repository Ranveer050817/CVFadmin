import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, X, Star, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Review } from '../../types';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);

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
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.code === '42P01') {
          console.warn('Reviews table not found, please run SQL migration');
          setReviews([]);
        } else {
          throw error;
        }
      } else {
        setReviews(data || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentReview(null);
    setName('');
    setDesignation('');
    setReviewText('');
    setRating(5);
    setFeatured(false);
    setActive(true);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (review: Review) => {
    setCurrentReview(review);
    setName(review.name || '');
    setDesignation(review.designation || '');
    setReviewText(review.text || '');
    setRating(review.rating || 5);
    setFeatured(review.featured ?? false);
    setActive(review.active ?? true);
    setImageFile(null);
    setImagePreview(review.image_url || null);
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

  const openDeleteModal = (review: Review) => {
    setCurrentReview(review);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentReview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Review text is required');
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = currentReview?.image_url || null;

    try {
      if (imageFile) {
        toast.loading('Uploading photo...', { id: 'upload-toast' });
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
        toast.success('Photo uploaded', { id: 'upload-toast' });
      } else if (!imagePreview && finalImageUrl) {
        finalImageUrl = null;
      }

      const payload = {
        name: name.trim(),
        designation: designation.trim() || null,
        text: reviewText.trim(),
        rating: rating,
        featured: featured,
        active: active,
        image_url: finalImageUrl
      };

      if (currentReview) {
        const { error } = await supabase
          .from('reviews')
          .update(payload)
          .eq('id', currentReview.id);

        if (error) throw error;
        toast.success('Review updated successfully');
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert([payload]);

        if (error) throw error;
        toast.success('Review added successfully');
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
    if (!currentReview) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', currentReview.id);

      if (error) throw error;

      toast.success('Review deleted successfully');
      closeModals();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter(review => 
    review.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 flex-grow flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reviews Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client testimonials and feedback.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
        >
          <Plus size={18} className="mr-2" />
          Add Review
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
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gold"></div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
            <Star size={32} className="text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No reviews found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search to find what you are looking for.' 
              : 'Get started by adding your first review.'}
          </p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Review
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                          {review.image_url ? (
                            <img src={review.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {review.name}
                            {review.featured && <Star size={14} className="ml-2 text-gold fill-gold" />}
                          </div>
                          <div className="text-xs text-gray-500">{review.designation || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 max-w-xs">
                      <div className="truncate">{review.text}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gold">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < review.rating ? "fill-gold" : "text-gray-300"} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${review.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {review.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => openEditModal(review)}
                          className="text-gray-400 hover:text-gold transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(review)}
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
                {currentReview ? 'Edit Review' : 'Add New Review'}
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">Client Photo (Optional)</label>
                  {imagePreview ? (
                    <div className="relative h-32 w-32 overflow-hidden rounded-full border border-gray-200 bg-gray-50 mx-auto md:mx-0">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute right-0 top-0 rounded-full bg-white/90 p-1.5 text-red-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gold hover:bg-gold-light/10 mx-auto md:mx-0"
                    >
                      <User size={28} className="text-gray-400 mb-2" />
                      <span className="text-xs font-medium text-gray-600 text-center">Upload<br/>Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center md:text-left">JPG, PNG, WEBP up to 5MB</p>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Client Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="E.g., Sarah & John"
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Rating (1-5)</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors bg-white"
                  >
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Client Role (Optional)</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
                    placeholder="E.g., Bride, Customer"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Review Text</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors resize-none"
                    placeholder="What did the client say?"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 border-t border-gray-100 pt-5 mt-2">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${featured ? 'bg-gold' : 'bg-gray-200'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${featured ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-medium text-gray-700">
                      Featured Review
                      <p className="text-xs text-gray-500 font-normal">Highlight on home page</p>
                    </div>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${active ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${active ? 'transform translate-x-4' : ''}`}></div>
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
                  {isSubmitting ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Review</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete the review from "{currentReview.name}"? This action cannot be undone.
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
