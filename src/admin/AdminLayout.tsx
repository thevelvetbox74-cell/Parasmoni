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
import { AdminStorefront } from './AdminStorefront';
import { AdminPages } from './AdminPages';
import { AdminFooter } from './AdminFooter';
import { AdminTestimonials } from './AdminTestimonials';
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
  ShieldAlert,
  Store,
  FileText,
  Paintbrush,
  Monitor,
  RefreshCw
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
      label: 'Storefront', 
      path: '/admin/storefront', 
      icon: Store,
      description: 'Live visual page-builder and drag-and-drop editor.'
    },
    { 
      label: 'Pages', 
      path: '/admin/pages', 
      icon: FileText,
      description: 'Manage website pages, SEO and custom paths.'
    },
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
      label: 'Testimonials', 
      path: '/admin/testimonials', 
      icon: MessageSquare,
      description: 'Manage genuine customer review cards with ratings & linked products.' 
    },
    { 
      label: 'Website Settings', 
      path: '/admin/settings', 
      icon: Settings,
      description: 'Helplines, logos and direct WhatsApp configs.' 
    },
    { 
      label: 'Footer', 
      path: '/admin/footer', 
      icon: Paintbrush,
      description: 'Site-wide footer background color and arch curves.' 
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
    <div className="h-screen w-full bg-[#FAF7F2] text-stone-800 flex flex-col md:flex-row font-sans selection:bg-rose-100 overflow-hidden" id="admin-portal-dashboard">
      
      {/* SECTION 1: Responsive Sidebar Navigation (collapsible desktop left panel) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-stone-200/60 flex flex-col h-full shrink-0 transition-transform duration-300 transform md:translate-x-0 md:static overflow-hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="admin-sidebar-nav"
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-amber-50 border border-amber-200/50 rounded-lg flex items-center justify-center text-[#B8860B] shadow-xs">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-[#6B1F2A] tracking-wider text-base leading-tight">PARASMONI</h2>
              <span className="text-[9px] text-[#B8860B] font-bold uppercase tracking-widest block leading-none mt-1">JEWELLERS & BROTHERS</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-stone-400 hover:text-stone-800 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items Container */}
        <nav className="flex-1 min-h-0 p-4 overflow-y-auto space-y-1 bg-[#FAF9F6]" id="admin-nav-items-track">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest px-3 block mb-3">SHOWROOM CMS</span>
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
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-amber-50/60 text-[#6B1F2A] border-l-4 border-[#6B1F2A] shadow-xs font-bold' 
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                  }
                `}
                id={`nav-item-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-[#6B1F2A]' : 'text-stone-400 group-hover:text-[#B8860B]'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer (Admin User Info & Direct Logout) */}
        <div className="p-4 border-t border-stone-200/60 bg-white flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#6B1F2A] border border-[#B8860B]/20 flex items-center justify-center text-[#FAF7F2] font-serif font-bold text-sm shrink-0 select-none shadow-xs">
            A
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs text-stone-800 font-bold truncate">ADMIN</span>
            <span className="block text-[9px] text-[#B8860B] font-bold uppercase tracking-widest leading-none mt-0.5">SUPER ADMIN</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-[#6B1F2A] cursor-pointer transition-colors"
            title="Log out of console"
            id="admin-sidebar-logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* SECTION 2: Main Console Window Container */}
      {location.pathname === '/admin/storefront' || location.pathname === '/admin/footer' ? (
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden relative" id="admin-storefront-viewport">
          {location.pathname === '/admin/storefront' ? <AdminStorefront /> : <AdminFooter />}
        </div>
      ) : (
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden relative" id="admin-main-viewport">
          
          {/* SECTION 2A: Admin Header (Dynamic status and mobile menu trigger) */}
          <header className="h-16 bg-white border-b border-stone-200/60 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0" id="admin-header-bar">
            
            {/* Mobile hamburger menu and active path label */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-stone-600 hover:text-[#6B1F2A] p-2 border border-stone-200 rounded-lg cursor-pointer transition-all"
                id="mobile-nav-toggle"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-bold block leading-none">SHOWROOM CONSOLE</span>
                <div className="flex items-center gap-1 text-xs text-stone-800 font-bold font-mono mt-1">
                  <span>Core</span>
                  <ChevronRight className="w-3 h-3 text-stone-400" />
                  <span className="text-[#B8860B] uppercase font-bold">{activeNav.label === 'Dashboard' ? 'DASHBOARD' : activeNav.label.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* User notification status, system indicators, and logout */}
            <div className="flex items-center gap-3">
              
              {/* Green pill-shaped "LIVE SYNC" status badge with a pulsing dot */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[9px] text-emerald-700 font-bold tracking-wider uppercase select-none">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>LIVE SYNC</span>
              </div>

              {/* Notification bell icon with a red dot indicator */}
              <button className="relative p-2 text-stone-400 hover:text-[#6B1F2A] transition-colors cursor-pointer rounded-full hover:bg-stone-50" title="Notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white" />
              </button>

              {/* Device button with icon */}
              <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-600 text-[10px] font-bold tracking-wider uppercase rounded-full transition-all duration-200 cursor-pointer">
                <Monitor className="w-3.5 h-3.5" />
                <span>Device</span>
              </button>

              {/* Remix button with icon */}
              <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-600 text-[10px] font-bold tracking-wider uppercase rounded-full transition-all duration-200 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Remix</span>
              </button>

              {/* Quick Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 hover:border-[#6B1F2A] hover:bg-rose-50/50 text-stone-600 hover:text-[#6B1F2A] text-[10px] font-bold tracking-wider uppercase rounded-full transition-all duration-200 cursor-pointer ml-1"
                id="admin-header-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>

            </div>
          </header>

          {/* SECTION 2B: Main CMS Content Workspace Wrapper */}
          <main className="flex-1 min-h-0 p-4 sm:p-8 overflow-y-auto overscroll-y-contain bg-[#FAF7F2]" id="admin-workspace-core">
            
            {/* Breadcrumb section header */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block font-sans">ACTIVE OPERATIONS HUB</span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#6B1F2A] tracking-wide mt-1">
                  {activeNav.label === 'Dashboard' ? 'Dashboard Center' : `${activeNav.label} Center`}
                </h1>
                <p className="text-stone-500 text-xs mt-1 max-w-xl font-sans">
                  {activeNav.description}
                </p>
              </div>
              
              {/* Action deck */}
              <div className="flex items-center gap-2 text-xs shrink-0">
                <a 
                  href="/" 
                  target="_blank" 
                  className="inline-flex items-center gap-1.5 text-stone-600 hover:text-[#6B1F2A] font-bold uppercase tracking-wider transition-all py-2 px-4 border border-stone-200 rounded-full bg-white hover:bg-stone-50 shadow-xs"
                >
                  <span>View Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                </a>
              </div>
            </div>

            {/* Interactive view panels */}
            <div className={
              location.pathname === '/admin' || location.pathname === '/admin/dashboard'
                ? ""
                : "bg-stone-950 border border-stone-800/80 rounded-xl p-6 sm:p-8"
            } id="admin-view-payload">
              {location.pathname === '/admin' || location.pathname === '/admin/dashboard' ? (
                <AdminDashboard />
              ) : location.pathname === '/admin/pages' ? (
                <AdminPages />
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
              ) : location.pathname === '/admin/testimonials' ? (
                <AdminTestimonials />
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
      )}

    </div>
  );
}
