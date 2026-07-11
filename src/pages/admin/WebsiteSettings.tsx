import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { WebsiteSettings as WebsiteSettingsType } from '../../types';

export const WebsiteSettings: React.FC = () => {
  const [settings, setSettings] = useState<WebsiteSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          console.warn('website_settings table not found');
        } else {
          throw error;
        }
      } else if (data) {
        setSettings(data);
        setLogoPreview(data.logo_url || null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/x-icon', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid image type');
      return;
    }

    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoRef.current) logoRef.current.value = '';
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error(`Failed to upload ${folder}: ${uploadError.message}`);

    const { data } = supabase.storage.from('gallery').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    toast.loading('Saving settings...', { id: 'save-settings' });

    try {
      let finalLogo = logoPreview; // Preserve existing if not removed and no new file

      if (logoFile) {
        finalLogo = await uploadImage(logoFile, 'logo');
      } else if (!logoPreview) {
        finalLogo = null;
      }

      const payload = {
        logo_url: finalLogo,
        updated_at: new Date().toISOString()
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('website_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('website_settings')
          .insert([payload]);
        if (error) throw error;
      }

      toast.success('Logo saved successfully', { id: 'save-settings' });
      
      setLogoFile(null);
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save logo', { id: 'save-settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gold"></div>
      </div>
    );
  }

  const renderImageUpload = (
    title: string,
    desc: string,
    preview: string | null,
    fileRef: React.RefObject<HTMLInputElement>,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemove: () => void,
    aspectRatioClass = "aspect-square w-32"
  ) => (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
      
      {preview ? (
        <div className={`relative ${aspectRatioClass} overflow-hidden rounded-lg border border-gray-200 bg-white group`}>
          <img src={preview} alt={title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full bg-white/90 p-2 text-red-600 shadow-sm hover:bg-white hover:text-red-700 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className={`flex ${aspectRatioClass} cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white transition-colors hover:border-gold hover:bg-gold-light/10`}
        >
          <ImageIcon size={24} className="text-gray-400 mb-2" />
          <span className="text-xs font-medium text-gray-600">Upload</span>
        </div>
      )}
      <input
        type="file"
        ref={fileRef}
        onChange={onChange}
        accept="image/jpeg,image/png,image/webp,image/x-icon,image/svg+xml"
        className="hidden"
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Website Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your business details, branding, and contact information.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Save size={18} className="mr-2" />
          )}
          Save Changes
        </button>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        
        {/* Branding Images */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
            <ImageIcon size={20} className="mr-2 text-gold" />
            Logo Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderImageUpload(
              "Logo", 
              "Used in navbar and footer. PNG/SVG recommended.",
              logoPreview, 
              logoRef, 
              (e) => handleImageChange(e, setLogoFile, setLogoPreview),
              removeLogo
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
