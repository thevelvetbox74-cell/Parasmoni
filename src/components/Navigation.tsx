/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Search, 
  Phone, 
  ChevronRight, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';

export function Navigation(): React.JSX.Element {
  const { settings } = useWebsiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const navLinks = [
    { label: 'HOME', path: '/' },
    { label: 'COLLECTIONS', path: '/catalog?focus=collections' },
    { label: 'JEWELLERY', path: '/catalog' },
    { label: 'ABOUT US', path: '/catalog?focus=collections' },
    { label: 'OUR STORES', path: '/stores' },
    { label: 'CONTACT', path: '/contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchBarOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white border-b border-stone-200 font-sans sticky top-0 z-50 shadow-sm" id="main-navigation">
      {/* Search Dropdown / Overlay */}
      {searchBarOpen && (
        <div className="bg-stone-50 border-b border-stone-200 py-4 px-6 animate-fade-in-up" id="header-search-bar">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-stone-400 shrink-0" />
            <input 
              type="text"
              placeholder="Search handcrafted gold, solitaire diamonds, kundan, jhumkas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden py-1"
              autoFocus
            />
            <button 
              type="button" 
              onClick={() => setSearchBarOpen(false)}
              className="text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity" onClick={() => setMobileMenuOpen(false)}>
          <img 
            src={settings.logoUrl} 
            alt={`${settings.brandName} Logo`} 
            className="h-14 w-auto object-contain rounded-md border border-stone-200 p-0.5 bg-stone-50"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-display text-xs md:text-sm tracking-wider text-stone-900 font-bold leading-tight uppercase">
              {settings.brandName.split('&')[0].trim()}
            </span>
            <span className="text-[8px] md:text-[9px] text-stone-500 tracking-widest uppercase font-bold">
              {settings.brandName.includes('&') ? '& ' + settings.brandName.split('&').slice(1).join('&').trim() : 'JEWELLERS'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-6 text-[11px] tracking-widest uppercase font-semibold text-stone-600">
          {navLinks.map((link) => (
            <Link 
              key={link.label} 
              to={link.path} 
              className="hover:text-brand-red-600 transition-colors relative py-2 group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-red-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Button */}
          <button 
            onClick={() => setSearchBarOpen(!searchBarOpen)}
            className="p-2 text-stone-600 hover:text-brand-red-600 transition-colors cursor-pointer"
            aria-label="Search Catalog"
            id="search-btn-toggle"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Catalog / Shopping CTA */}
          <Link 
            to="/catalog" 
            className="hidden sm:flex p-2 text-stone-600 hover:text-brand-red-600 transition-colors cursor-pointer"
            aria-label="View Collections"
          >
            <ShoppingBag className="w-5 h-5" />
          </Link>

          {/* Desktop Contact CTA Button */}
          <Link 
            to="/contact" 
            className="hidden md:flex h-10 px-5 bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 border border-brand-red-600/20 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>CONTACT US</span>
          </Link>

          {/* Mobile Phone/Contact Quick CTA */}
          <a 
            href={`tel:${settings.contactNumber}`}
            className="md:hidden p-2 text-stone-600 hover:text-brand-red-600 transition-colors"
            aria-label="Call Us"
          >
            <Phone className="w-5 h-5" />
          </a>

          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-stone-600 hover:text-brand-red-600 transition-colors cursor-pointer"
            aria-label="Toggle Menu"
            id="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Slide down/fade) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-t border-stone-200 shadow-lg absolute left-0 right-0 py-6 px-6 space-y-6 z-40 animate-fade-in-up" id="mobile-navigation-drawer">
          <div className="space-y-3">
            {navLinks.map((link) => (
              <Link 
                key={link.label} 
                to={link.path} 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-stone-700 hover:text-brand-red-600 transition-colors tracking-widest uppercase py-2 border-b border-stone-100 flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-4">
            <Link 
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-11 bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Us</span>
            </Link>
            
            <a 
              href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 bg-transparent hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              <span>Inquire via WhatsApp</span>
            </a>
          </div>

          <div className="text-center text-[10px] text-stone-400 font-sans">
            {settings.workingHours}
          </div>
        </div>
      )}
    </header>
  );
}

