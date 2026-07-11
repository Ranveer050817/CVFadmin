import React from 'react';

interface DashboardCardProps {
  title: string;
  count: number | string;
  icon: React.ReactNode;
  loading?: boolean;
  type?: 'progress' | 'side';
  progressValue?: number;
  subtitle?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, count, icon, loading = false, type = 'progress', progressValue = 50, subtitle
}) => {
  if (type === 'side') {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">{title}</span>
          <span className="text-4xl font-light text-gray-900">
            {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-gray-200"></span> : String(count).padStart(2, '0')}
          </span>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div className="w-16 h-16 rounded-full border border-gray-50 flex items-center justify-center text-gold bg-gray-50">
          {icon}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{title}</span>
      <div className="flex items-end justify-between">
        <span className="text-4xl font-light text-gray-900">
          {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-gray-200"></span> : count}
        </span>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 text-gold">
          {icon}
        </div>
      </div>
      <div className="mt-4 h-1 w-full bg-gray-50 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full bg-gold transition-all duration-1000" 
          style={{ width: `${progressValue}%` }}
        ></div>
      </div>
    </div>
  );
};
