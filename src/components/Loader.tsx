import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-light">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
    </div>
  );
};
