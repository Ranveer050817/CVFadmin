import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Gallery } from './pages/admin/Gallery';
import { Categories } from './pages/admin/Categories';
import { Services } from './pages/admin/Services';
import { Packages } from './pages/admin/Packages';
import { Reviews } from './pages/admin/Reviews';

import { WebsiteSettings } from './pages/admin/WebsiteSettings';
import { Home } from './pages/Home';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="categories" element={<Categories />} />
              <Route path="services" element={<Services />} />
              <Route path="packages" element={<Packages />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="settings" element={<WebsiteSettings />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
