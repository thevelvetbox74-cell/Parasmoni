/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLocation, Navigate, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { unlockAdminSession } from './sessionHelper';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminBanners } from './AdminBanners';
import { AdminCollections } from './AdminCollections';
import { AdminCategories } from './AdminCategories';
import { AdminMetalPrices } from './AdminMetalPrices';
import { AdminStores } from './AdminStores';
import { AdminSettings } from './AdminSettings';
import { AdminEnquiries } from './AdminEnquiries';
import { AdminMedia } from './AdminMedia';
import { AdminUsers } from './AdminUsers';
import { AdminSeo } from './AdminSeo';
import { 
  LayoutDashboard, 
  Gem, 
  Layers, 
  Tags, 
  Image as ImageIcon, 
  CircleDollarSign, 
  MapPin, 
  MessageSquare, 
  Settings, 
  Users, 
  FolderHeart, 
  Globe, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Bell,
  Sparkles,
  ChevronRight,
  Info,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  description: string;
}

export function AdminLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { user, adminProfile, loading, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If loading, show elegant full-screen spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-300 font-sans select-none" id="admin-global-spinner">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-widest font-bold text-stone-400">Security Clearance</span>
            <span className="block text-[10px] text-stone-500">Checking administrator privileges...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is accessing login route, render Login component directly
  if (location.pathname === '/admin/login') {
    if (user && isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <AdminLogin />;
  }

  // Protected route check: If not authenticated, redirect to Admin login
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Admin Sidebar Navigation Items configuration
  const navigationItems: SidebarItem[] = [
    { 
      label: 'Dashboard', 
      path: '/admin', 
      icon: LayoutDashboard,
      description: 'Business overview, stats and metrics.'
    },
    { 
      label: 'Products', 
      path: '/admin/products', 
      icon: Gem,
      description: 'Manage jewellery inventory, weights and codes.' 
    },
    { 
      label: 'Collections', 
      path: '/admin/collections', 
      icon: FolderHeart,
      description: 'Bridal, Antique, Temple and modern sets.' 
    },
    { 
      label: 'Categories', 
      path: '/admin/categories', 
      icon: Tags,
      description: 'Necklaces, bangles, rings classifications.' 
    },
    { 
      label: 'Banners', 
      path: '/admin/banners', 
      icon: ImageIcon,
      description: 'Homepage dynamic billboard showcase.' 
    },
    { 
      label: 'Metal Prices', 
      path: '/admin/metal-prices', 
      icon: CircleDollarSign,
      description: 'Live rate configuration for 24K, 22K and 18K.' 
    },
    { 
      label: 'Stores', 
      path: '/admin/stores', 
      icon: MapPin,
      description: 'Showroom location registers and map markers.' 
    },
    { 
      label: 'Customers/Enquiries', 
      path: '/admin/enquiries', 
      icon: MessageSquare,
      description: 'Review and reply to leads logged from site.' 
    },
    { 
      label: 'Website Settings', 
      path: '/admin/settings', 
      icon: Settings,
      description: 'Helplines, logos and direct WhatsApp configs.' 
    },
    { 
      label: 'Admin Users', 
      path: '/admin/users', 
      icon: Users,
      description: 'Manage staff panel clearance credentials.' 
    },
    { 
      label: 'Media Library', 
      path: '/admin/media', 
      icon: Layers,
      description: 'Ornaments asset storage and CDN uploads.' 
    },
    { 
      label: 'SEO Settings', 
      path: '/admin/seo', 
      icon: Globe,
      description: 'Configure index cards, keywords and sitemaps.' 
    }
  ];

  // Resolve current view info
  const activeNav = navigationItems.find(item => {
    if (item.path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(item.path);
  }) || navigationItems[0];

  const handleLogout = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await auth.signOut();
      }
    } catch (err) {
      console.warn("Firebase logout failed:", err);
    } finally {
      unlockAdminSession();
      window.location.reload();
    }
  };

  const adminName = adminProfile?.name || user.email?.split('@')[0] || 'Administrator';
  const adminRoleLabel = adminProfile?.role === 'super_admin' ? 'Super Admin' : 'Editor';

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col md:flex-row font-sans selection:bg-amber-500/20" id="admin-portal-dashboard">
      
      {/* SECTION 1: Responsive Sidebar Navigation (collapsible desktop left panel) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-stone-950 border-r border-stone-800/80 flex flex-col transition-transform duration-300 transform md:translate-x-0 md:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="admin-sidebar-nav"
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-amber-600/15 border border-amber-600/30 rounded flex items-center justify-center text-amber-500">
              <Gem className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-stone-50 tracking-wider text-sm leading-tight">PARASMONI</h2>
              <span className="text-[9px] text-amber-500/80 font-bold uppercase tracking-widest block">OPERATIONS CORE</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-stone-400 hover:text-stone-100 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items Container */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-1" id="admin-nav-items-track">
          <span className="text-[10px] text-stone-600 font-bold uppercase tracking-widest px-3 block mb-2">Showroom CMS</span>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isHomePath = item.path === '/admin';
            const isActive = isHomePath 
              ? (location.pathname === '/admin' || location.pathname === '/admin/dashboard')
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive: linkActive }) => `
                  group flex items-center gap-3 px-3 py-2.5 rounded text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-amber-600 text-stone-950 font-bold shadow-md shadow-amber-600/10' 
                      : 'text-stone-400 hover:text-stone-50 hover:bg-stone-900/60'
                  }
                `}
                id={`nav-item-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-stone-950' : 'text-stone-400 group-hover:text-amber-500'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer (Admin User Info & Direct Logout) */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-500 shrink-0 select-none">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[11px] text-stone-100 font-bold truncate">{adminName}</span>
            <span className="block text-[9px] text-amber-500 font-medium uppercase tracking-widest">{adminRoleLabel}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-stone-900 rounded text-stone-400 hover:text-red-400 cursor-pointer transition-colors"
            title="Log out of console"
            id="admin-sidebar-logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* SECTION 2: Main Console Window Container */}
      <div className="flex-1 flex flex-col min-w-0" id="admin-main-viewport">
        
        {/* SECTION 2A: Admin Header (Dynamic status and mobile menu trigger) */}
        <header className="h-16 bg-stone-950 border-b border-stone-800/80 px-4 sm:px-6 flex items-center justify-between z-10" id="admin-header-bar">
          
          {/* Mobile hamburger menu and active path label */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-stone-300 hover:text-stone-50 p-2 border border-stone-800 rounded cursor-pointer transition-all"
              id="mobile-nav-toggle"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Showroom Console</span>
              <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium font-mono">
                <span>Core</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
                <span className="text-amber-500 uppercase font-bold">{activeNav.label}</span>
              </div>
            </div>
          </div>

          {/* User notification status, system indicators, and logout */}
          <div className="flex items-center gap-4">
            
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/5 border border-amber-500/10 text-[9px] text-amber-400 font-bold tracking-wider uppercase select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>{isFirebaseConfigured ? "Live Sync Active" : "Local Demo Mode"}</span>
            </div>

            {/* Notifications Alert */}
            <button className="relative p-2 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer rounded-full hover:bg-stone-900" title="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
            </button>

            {/* Quick Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-800 hover:border-red-900 hover:bg-red-950/15 text-stone-300 hover:text-red-400 text-[10px] font-bold tracking-widest uppercase rounded transition-all duration-200 cursor-pointer"
              id="admin-header-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

          </div>
        </header>

        {/* SECTION 2B: Main CMS Content Workspace Wrapper */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto" id="admin-workspace-core">
          
          {/* Breadcrumb section header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">Active Operations Hub</span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-50 tracking-wide mt-0.5">
                {activeNav.label} Center
              </h1>
              <p className="text-stone-400 text-xs mt-1 max-w-xl font-sans">
                {activeNav.description} Verify metrics, logs, and listings safely.
              </p>
            </div>
            
            {/* Action deck */}
            <div className="flex items-center gap-2 text-xs">
              <a 
                href="/" 
                target="_blank" 
                className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-100 font-bold uppercase tracking-wider transition-colors py-2 px-3 border border-stone-800 rounded bg-stone-950/20"
              >
                <span>View Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Interactive view panels (Render custom placeholders for shell demonstration) */}
          <div className="bg-stone-950 border border-stone-800/80 rounded p-6 sm:p-8" id="admin-view-payload">
            {location.pathname === '/admin' || location.pathname === '/admin/dashboard' ? (
              <AdminDashboard />
            ) : location.pathname === '/admin/products' ? (
              <AdminProducts />
            ) : location.pathname === '/admin/collections' ? (
              <AdminCollections />
            ) : location.pathname === '/admin/categories' ? (
              <AdminCategories />
            ) : location.pathname === '/admin/banners' ? (
              <AdminBanners />
            ) : location.pathname === '/admin/metal-prices' ? (
              <AdminMetalPrices />
            ) : location.pathname === '/admin/stores' ? (
              <AdminStores />
            ) : location.pathname === '/admin/enquiries' ? (
              <AdminEnquiries />
            ) : location.pathname === '/admin/settings' ? (
              <AdminSettings />
            ) : location.pathname === '/admin/media' ? (
              <AdminMedia />
            ) : location.pathname === '/admin/users' ? (
              <AdminUsers />
            ) : location.pathname === '/admin/seo' ? (
              <AdminSeo />
            ) : (
              
              /* Generic CMS Section Placeholder screen based on navigation */
              <div className="py-12 text-center space-y-4 max-w-md mx-auto" id={`shell-placeholder-${activeNav.label.toLowerCase()}`}>
                <div className="inline-flex h-12 w-12 rounded-full bg-stone-900 border border-stone-800 items-center justify-center text-amber-500">
                  <activeNav.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg font-bold text-stone-200">{activeNav.label} Manager</h3>
                  <p className="text-stone-400 text-xs leading-relaxed font-sans">
                    You are in the secure operations shell of the **{activeNav.label}** portal. The administrative controller layout is fully authenticated and protected.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 bg-amber-500/5 border border-amber-500/10 rounded px-3 py-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    <X className="w-3.5 h-3.5 animate-pulse shrink-0" />
                    <span>Live CMS module compilation ready</span>
                  </span>
                </div>
              </div>

            )}
          </div>

        </main>
      </div>

    </div>
  );
}
