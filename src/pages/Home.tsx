import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WebsiteSettings, Service, Package, Review, CategoryWithStats } from '../types';
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, servicesRes, packagesRes, reviewsRes, categoriesRes] = await Promise.all([
        supabase.from('website_settings').select('*').maybeSingle(),
        supabase.from('services').select('*').order('created_at', { ascending: false }),
        supabase.from('packages').select('*').eq('is_active', true).order('display_order', { ascending: true }),
        supabase.from('reviews').select('*').eq('active', true).order('display_order', { ascending: true }),
        supabase.from('categories').select('*').order('created_at', { ascending: false })
      ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data);
        
        // Update document title and favicon
        if (settingsRes.data.business_name) {
          document.title = `${settingsRes.data.business_name} ${settingsRes.data.tagline ? `- ${settingsRes.data.tagline}` : ''}`;
        }
        
        if (settingsRes.data.favicon_url) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settingsRes.data.favicon_url;
        }
      }
      
      if (servicesRes.data) setServices(servicesRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data as any);
      
    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gold"></div>
      </div>
    );
  }

  const defaultHero = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop';
  
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="h-10 w-10 bg-gold rounded-lg"></div>
              )}
              <span className="font-bold text-xl text-white drop-shadow-md">
                {settings?.business_name || 'My Studio'}
              </span>
            </div>
            <div>
              <Link to="/login" className="text-white hover:text-gold transition-colors font-medium drop-shadow-md">
                Client Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={settings?.hero_image || defaultHero} 
            alt="Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 drop-shadow-lg">
            {settings?.business_name || 'Photography Studio'}
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 font-light mb-10 drop-shadow-md">
            {settings?.tagline || 'Capturing moments that last a lifetime'}
          </p>
          <button className="bg-gold hover:bg-gold-dark text-white px-8 py-4 rounded-full font-medium text-lg transition-colors shadow-lg">
            View Our Work
          </button>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Get in Touch</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              {settings?.about_description || 'We would love to hear from you.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {settings?.phone && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="h-12 w-12 bg-gold/10 rounded-full flex items-center justify-center mb-4 text-gold">
                  <Phone size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
                <p className="text-gray-600">{settings.phone}</p>
                {settings.whatsapp && (
                  <p className="text-green-600 mt-2 text-sm">WhatsApp: {settings.whatsapp}</p>
                )}
              </div>
            )}
            
            {settings?.email && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="h-12 w-12 bg-gold/10 rounded-full flex items-center justify-center mb-4 text-gold">
                  <Mail size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600">{settings.email}</p>
              </div>
            )}
            
            {settings?.address && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="h-12 w-12 bg-gold/10 rounded-full flex items-center justify-center mb-4 text-gold">
                  <MapPin size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">{settings.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-8 w-auto object-contain brightness-0 invert" />
              ) : null}
              <span className="font-semibold text-lg">{settings?.business_name}</span>
            </div>
            
            <div className="flex gap-4">
              {settings?.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram size={24} />
                </a>
              )}
              {settings?.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook size={24} />
                </a>
              )}
              {settings?.youtube && (
                <a href={settings.youtube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Youtube size={24} />
                </a>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {settings?.business_name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
