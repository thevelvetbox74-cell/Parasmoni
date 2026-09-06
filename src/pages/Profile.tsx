/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Sparkles, 
  Phone, 
  MessageCircle, 
  Mail, 
  ChevronRight, 
  BookOpen, 
  Instagram, 
  Facebook, 
  Youtube, 
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { Footer } from '../components/Footer';

export function Profile(): React.JSX.Element {
  const { settings, loading } = useWebsiteSettings();
  const [showAbout, setShowAbout] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-[#6B1F2A] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-500 text-xs sm:text-sm">Loading showroom information...</p>
      </div>
    );
  }

  const brandName = settings?.brandName || "Parasmoni Jewellers & Brothers";
  const tagline = settings?.tagline || "Timeless Purity, Crafted with Handcrafted Nakashi & Filigree";
  const logoUrl = settings?.logoUrl || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=200";
  const aboutText = settings?.aboutText || "Established in 1974, Parasmoni Jewellers & Brothers stands as a hallmark of purity, intricate traditional filigree, and contemporary masterpieces. We curate certified gold and diamond jewellery customized to your aesthetic sensibilities.";
  
  const rawWhatsapp = settings?.whatsappNumber || "919051412413";
  const whatsappNumber = rawWhatsapp.replace(/[^0-9]/g, '');
  const whatsappMessage = settings?.whatsappMessage || 'Hello Parasmoni Jewellers, I am browsing your showroom on my mobile device and would love to enquire about your signature jewellery collection.';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const rawPhone = settings?.contactNumber || "+91 33 2241 9876";
  const phoneUrl = `tel:${rawPhone.replace(/\s+/g, '')}`;

  return (
    <div className="min-h-screen bg-stone-50 pb-28 md:pb-16 pt-6 sm:pt-10" id="profile-page">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        
        {/* Brand/Identity Header Card */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 text-center shadow-xs mb-6" id="profile-header-card">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-stone-50 rounded-full border border-stone-150 p-2 mx-auto flex items-center justify-center shadow-inner overflow-hidden">
              <img 
                src={logoUrl} 
                alt={`${brandName} Logo`} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 shadow-md border border-white">
              <Sparkles className="w-3.5 h-3.5 text-stone-100" />
            </div>
          </div>
          
          <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-wide uppercase">
            {brandName}
          </h1>
          <p className="text-[#6B1F2A] font-serif text-[11px] sm:text-xs tracking-widest font-semibold mt-1.5 uppercase">
            ESTD. 1974 • Heritage of Purity
          </p>
          <div className="w-16 h-px bg-amber-200/60 mx-auto my-3" />
          <p className="text-stone-500 text-[11px] sm:text-xs italic max-w-sm mx-auto leading-relaxed">
            "{tagline}"
          </p>
        </div>

        {/* Navigation / Actions Hub List */}
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs space-y-px" id="profile-links-list">
          
          {/* Section Indicator */}
          <div className="px-6 pt-5 pb-2 bg-stone-50/50 border-b border-stone-100">
            <span className="text-[10px] font-sans font-bold tracking-widest text-stone-400 uppercase">
              SHOWROOM NAVIGATION
            </span>
          </div>

          {/* 1. Our Stores */}
          <Link 
            to="/our-stores"
            className="flex items-center justify-between px-6 py-4.5 hover:bg-stone-50 transition-colors active:bg-stone-100/50 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                <Store className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="font-sans font-semibold text-xs sm:text-sm text-stone-800 uppercase tracking-wide">
                  Our Showrooms
                </h3>
                <p className="text-[10px] sm:text-xs text-stone-400">
                  Find showroom locations & hours
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
          </Link>

          {/* 2. Contact Us */}
          <Link 
            to="/contact"
            className="flex items-center justify-between px-6 py-4.5 border-t border-stone-100 hover:bg-stone-50 transition-colors active:bg-stone-100/50 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#6B1F2A]/5 flex items-center justify-center text-[#6B1F2A] shrink-0">
                <Mail className="w-5 h-5 text-[#6B1F2A]" />
              </div>
              <div className="text-left">
                <h3 className="font-sans font-semibold text-xs sm:text-sm text-stone-800 uppercase tracking-wide">
                  Enquire & Contact Us
                </h3>
                <p className="text-[10px] sm:text-xs text-stone-400">
                  Send a query to our craftsmen
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
          </Link>

          {/* 3. About Us / Heritage (Expandable Accordion row) */}
          <div className="border-t border-stone-100">
            <button 
              onClick={() => setShowAbout(!showAbout)}
              className="w-full flex items-center justify-between px-6 py-4.5 hover:bg-stone-50 transition-colors active:bg-stone-100/50 group text-left cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-amber-600 shrink-0">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-xs sm:text-sm text-stone-800 uppercase tracking-wide">
                    Our Timeless Legacy
                  </h3>
                  <p className="text-[10px] sm:text-xs text-stone-400">
                    Discover our journey since 1974
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-transform duration-250 ${showAbout ? 'rotate-90' : ''}`} />
            </button>
            {showAbout && (
              <div className="px-6 pb-6 pt-2 bg-stone-50 border-t border-stone-100/50 animate-fade-in-down">
                <p className="font-sans text-[11px] sm:text-xs text-stone-600 leading-relaxed max-w-md">
                  {aboutText}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                  <span className="text-[9px] font-bold tracking-widest text-amber-600 uppercase font-sans">
                    100% BIS Hallmark Gold Guaranteed
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Connect / Contact Links Header */}
          <div className="px-6 pt-5 pb-2 bg-stone-50/50 border-t border-stone-100 border-b border-stone-100">
            <span className="text-[10px] font-sans font-bold tracking-widest text-stone-400 uppercase">
              DIRECT CRAFTSMAN ENQUIRY
            </span>
          </div>

          {/* 4. WhatsApp Us */}
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-6 py-4.5 hover:bg-stone-50 transition-colors active:bg-stone-100/50 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="font-sans font-semibold text-xs sm:text-sm text-stone-800 uppercase tracking-wide">
                  Enquire via WhatsApp
                </h3>
                <p className="text-[10px] sm:text-xs text-stone-400">
                  Instant chat with showroom assistant
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
          </a>

          {/* 5. Call Us */}
          <a 
            href={phoneUrl}
            className="flex items-center justify-between px-6 py-4.5 border-t border-stone-100 hover:bg-stone-50 transition-colors active:bg-stone-100/50 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-sans font-semibold text-xs sm:text-sm text-stone-800 uppercase tracking-wide">
                  Call Customer Care
                </h3>
                <p className="text-[10px] sm:text-xs text-stone-400">
                  {rawPhone}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
          </a>
        </div>

        {/* Social Media Channels block (if configured) */}
        {settings?.socials && (
          <div className="mt-6 bg-white border border-stone-200 rounded-3xl p-6 text-center shadow-xs" id="profile-socials">
            <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-800 tracking-wider uppercase mb-3">
              Follow Our Artistry
            </h4>
            <div className="flex items-center justify-center gap-4">
              {settings.socials.instagram && (
                <a 
                  href={settings.socials.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-stone-50 border border-stone-150 flex items-center justify-center hover:bg-[#6B1F2A] hover:text-stone-100 transition-all hover:scale-115 text-stone-500 cursor-pointer"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.socials.facebook && (
                <a 
                  href={settings.socials.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-stone-50 border border-stone-150 flex items-center justify-center hover:bg-blue-600 hover:text-stone-100 transition-all hover:scale-115 text-stone-500 cursor-pointer"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.socials.youtube && (
                <a 
                  href={settings.socials.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-stone-50 border border-stone-150 flex items-center justify-center hover:bg-red-600 hover:text-stone-100 transition-all hover:scale-115 text-stone-500 cursor-pointer"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {settings.socials.pinterest && (
                <a 
                  href={settings.socials.pinterest} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-stone-50 border border-stone-150 flex items-center justify-center hover:bg-amber-600 hover:text-stone-100 transition-all hover:scale-115 text-stone-500 cursor-pointer"
                  aria-label="Pinterest"
                >
                  <Compass className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Live Admin-Managed Full Footer Section */}
        <div className="mt-8 pt-6 border-t border-stone-200">
          <Footer />
        </div>

        {/* Footer info showing client-side local nature */}
        <div className="text-center mt-6 text-stone-400 text-[10px] font-sans tracking-wide">
          <p>Parasmoni Showroom Hub • Version 1.2.0</p>
          <p className="mt-0.5">Offline-first navigational helper securely loaded on this device.</p>
        </div>

      </div>
    </div>
  );
}
