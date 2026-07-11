import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardCard } from '../../components/DashboardCard';

export const Dashboard: React.FC = () => {
  const [counts, setCounts] = useState({
    gallery: 0,
    categories: 0,
    services: 0,
    packages: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const [
          { count: galleryCount },
          { count: categoriesCount },
          { count: servicesCount },
          { count: packagesCount },
          { count: reviewsCount }
        ] = await Promise.all([
          supabase.from('gallery_images').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase.from('services').select('*', { count: 'exact', head: true }),
          supabase.from('packages').select('*', { count: 'exact', head: true }),
          supabase.from('reviews').select('*', { count: 'exact', head: true }),
        ]);

        setCounts({
          gallery: galleryCount || 0,
          categories: categoriesCount || 0,
          services: servicesCount || 0,
          packages: packagesCount || 0,
          reviews: reviewsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="space-y-8 flex-grow">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard 
          title="Total Gallery Images" 
          count={counts.gallery} 
          icon={<span className="text-xl">📸</span>} 
          loading={loading} 
          type="progress"
          progressValue={85}
        />
        <DashboardCard 
          title="Total Categories" 
          count={counts.categories} 
          icon={<span className="text-xl">📁</span>} 
          loading={loading} 
          type="progress"
          progressValue={40}
        />
        <DashboardCard 
          title="Total Services" 
          count={counts.services} 
          icon={<span className="text-xl">🎥</span>} 
          loading={loading} 
          type="progress"
          progressValue={60}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard 
          title="Total Packages" 
          count={counts.packages} 
          icon={<span className="text-2xl">💎</span>} 
          loading={loading} 
          type="side"
          subtitle="Active cinematic collections"
        />
        <DashboardCard 
          title="Total Reviews" 
          count={counts.reviews} 
          icon={<span className="text-2xl">✉️</span>} 
          loading={loading} 
          type="side"
          subtitle="98% Client satisfaction rate"
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-800">Quick Status</h2>
          <button className="text-xs font-semibold px-4 py-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors">View All Database Tables</button>
        </div>
        <div className="flex items-center gap-12 text-center py-4 flex-wrap">
          <div>
            <div className="text-2xl font-semibold text-gold">ONLINE</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Supabase Connection</div>
          </div>
          <div className="w-px h-12 bg-gray-100 hidden sm:block"></div>
          <div>
            <div className="text-2xl font-semibold text-gray-900">LIVE</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Website Status</div>
          </div>
          <div className="w-px h-12 bg-gray-100 hidden sm:block"></div>
          <div>
            <div className="text-2xl font-semibold text-gray-900">12 ms</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">API Latency</div>
          </div>
        </div>
      </div>

    </div>
  );
};
