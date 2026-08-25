/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Send, 
  MapPin, 
  Phone, 
  Tag, 
  Heart, 
  Eye, 
  ChevronRight,
  Info,
  CheckCircle,
  HelpCircle,
  Menu,
  Clock
} from 'lucide-react';

export function StyleGuide(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'buttons' | 'cards' | 'forms'>('colors');
  const [liked, setLiked] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 font-sans" id="design-system-styleguide">
      {/* Showroom Header branding */}
      <div className="text-center mb-16 border-b border-stone-200 pb-12">
        <div className="flex justify-center mb-4">
          <img 
            src="https://ik.imagekit.io/ugm0ru2xm/Screenshot%202026-08-25%20135242.jpg?updatedAt=1787646387697" 
            alt="Parasmoni Jewellers Logo" 
            className="h-20 w-auto object-contain rounded-md border border-stone-200"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="text-[11px] text-gold-600 font-display font-semibold tracking-[0.3em] uppercase block mb-3">
          Luxury Design System
        </span>
        <h1 className="text-3xl md:text-5xl font-display font-medium text-stone-900 tracking-wider mb-4">
          PARASMONI JEWELLERS
        </h1>
        <p className="font-serif italic text-stone-500 text-sm max-w-xl mx-auto leading-relaxed">
          Establishing an atmosphere of trust, heritage, and pure Indian craftsmanship since 1974. Guided by mathematical symmetry, premium typography, and royal accents.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12 border-b border-stone-200 pb-4">
        {[
          { id: 'colors', label: 'Color Palette' },
          { id: 'typography', label: 'Typography Matrix' },
          { id: 'buttons', label: 'Buttons & Actions' },
          { id: 'cards', label: 'Showroom Cards' },
          { id: 'forms', label: 'Bespoke Forms' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300 border-b-2 ${
              activeTab === tab.id
                ? 'border-brand-red-950 text-brand-red-950 bg-stone-100/50'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Style Guide Content Grid */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: COLORS */}
        {activeTab === 'colors' && (
          <div className="space-y-12 animate-fade-in-up" id="styleguide-colors">
            <div>
              <h3 className="text-lg font-serif font-semibold text-stone-900 mb-2">1. Core Brand Identity (Vibrant Logo Red)</h3>
              <p className="text-stone-500 text-xs mb-4">Used for hero text, branding, buttons, and matching the official 1974 emblem.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                <div className="bg-brand-red-950 p-4 rounded border border-stone-200 text-stone-100 flex flex-col justify-between h-28">
                  <span className="text-xs font-bold tracking-wider">Logo Red (950)</span>
                  <span className="text-[10px] uppercase font-mono">#E31C24</span>
                </div>
                <div className="bg-brand-red-800 p-4 rounded border border-stone-200 text-stone-100 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Bright Crimson</span>
                  <span className="text-[10px] uppercase font-mono">#991B1B</span>
                </div>
                <div className="bg-brand-red-600 p-4 rounded border border-stone-200 text-stone-100 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Signature Red</span>
                  <span className="text-[10px] uppercase font-mono">#E31C24</span>
                </div>
                <div className="bg-brand-red-400 p-4 rounded border border-stone-200 text-stone-900 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Light Crimson</span>
                  <span className="text-[10px] uppercase font-mono">#F87171</span>
                </div>
                <div className="bg-brand-red-100 p-4 rounded border border-stone-200 text-brand-red-950 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Tint Wash</span>
                  <span className="text-[10px] uppercase font-mono">#f7e6e7 (100)</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-serif font-semibold text-stone-900 mb-2">2. Authentic Metallic Gold Accents</h3>
              <p className="text-stone-500 text-xs mb-4">Reflects gold purity, craftsmanship motifs, and status badges.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                <div className="bg-gold-500 p-4 rounded border border-stone-200 text-stone-950 flex flex-col justify-between h-28">
                  <span className="text-xs font-bold tracking-wider">Antique Gold</span>
                  <span className="text-[10px] uppercase font-mono">#b58b37 (500)</span>
                </div>
                <div className="bg-gold-400 p-4 rounded border border-stone-200 text-stone-950 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Bright Gold</span>
                  <span className="text-[10px] uppercase font-mono">#c5a456 (400)</span>
                </div>
                <div className="bg-gold-300 p-4 rounded border border-stone-200 text-stone-900 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Muted Gold</span>
                  <span className="text-[10px] uppercase font-mono">#d7c183 (300)</span>
                </div>
                <div className="bg-gold-100 p-4 rounded border border-stone-200 text-stone-800 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Gold Dust</span>
                  <span className="text-[10px] uppercase font-mono">#f4edd9 (100)</span>
                </div>
                <div className="bg-gradient-to-r from-gold-300 via-gold-500 to-gold-700 p-4 rounded border border-stone-300 text-stone-950 flex flex-col justify-between h-28">
                  <span className="text-xs font-bold tracking-wider text-shadow-subtle">Gold Gradient</span>
                  <span className="text-[10px] uppercase font-semibold">Metallic Shimmer</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-serif font-semibold text-stone-900 mb-2">3. Warm Editorial Neutrals</h3>
              <p className="text-stone-500 text-xs mb-4">Muted cream bases and deep stone shades for an antique, trustworthy backdrop.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                <div className="bg-cream-50 p-4 rounded border border-stone-200 text-stone-800 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Showroom Cream</span>
                  <span className="text-[10px] uppercase font-mono">#fdfcf7 (50)</span>
                </div>
                <div className="bg-cream-100 p-4 rounded border border-stone-200 text-stone-800 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Soft Ivory</span>
                  <span className="text-[10px] uppercase font-mono">#fbf9f0 (100)</span>
                </div>
                <div className="bg-stone-200 p-4 rounded border border-stone-300 text-stone-800 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Warm Gray</span>
                  <span className="text-[10px] uppercase font-mono">#e7e5e4 (200)</span>
                </div>
                <div className="bg-stone-700 p-4 rounded border border-stone-600 text-stone-100 flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Deep Charcoal</span>
                  <span className="text-[10px] uppercase font-mono">#44403c (700)</span>
                </div>
                <div className="bg-stone-900 p-4 rounded border border-stone-800 text-stone-100 flex flex-col justify-between h-28">
                  <span className="text-xs font-bold tracking-wider">Royal Obsidian</span>
                  <span className="text-[10px] uppercase font-mono">#1c1917 (900)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TYPOGRAPHY */}
        {activeTab === 'typography' && (
          <div className="space-y-10 animate-fade-in-up" id="styleguide-typography">
            <div className="bg-white p-8 rounded-lg border border-stone-200 shadow-sm space-y-8">
              <div>
                <span className="text-[10px] text-gold-600 font-display font-bold tracking-widest uppercase block mb-1">
                  Brand Header Typeface: Cinzel
                </span>
                <p className="text-3xl font-display text-stone-900 tracking-wider">
                  THE ART OF HANDCRAFTED HERITAGE
                </p>
                <p className="text-stone-500 text-xs mt-2 font-sans">
                  A high-contrast roman display serif designed for high luxury and showroom signages. Best used with wide letter-spacing (tracking).
                </p>
              </div>

              <div className="border-t border-stone-100 pt-6">
                <span className="text-[10px] text-gold-600 font-sans font-bold tracking-widest uppercase block mb-1">
                  Editorial Title Typeface: Playfair Display
                </span>
                <p className="text-4xl font-serif text-brand-red-950 font-normal">
                  Choker Sets in Royal 22K Antique Gold
                </p>
                <p className="text-3xl font-serif italic text-gold-600 mt-1 font-normal">
                  Crafting relationships since 1974
                </p>
                <p className="text-stone-500 text-xs mt-2 font-sans">
                  A delicate, elegant editorial serif perfect for product titles, legacy narratives, and descriptive catalog section titles.
                </p>
              </div>

              <div className="border-t border-stone-100 pt-6">
                <span className="text-[10px] text-gold-600 font-sans font-bold tracking-widest uppercase block mb-1">
                  Technical details & UI Typeface: Plus Jakarta Sans
                </span>
                <p className="text-sm font-sans text-stone-800 leading-relaxed max-w-2xl">
                  Gross Weight: 48.50 grams • Gold Purity: 22 Karat Antique Gold Filigree. Diamond Details: 1.20 ct VVS1 clarity G-H color certified solitaire settings. Standard making charges are calculated at 12% per gram.
                </p>
                <p className="text-stone-500 text-xs mt-2 font-sans">
                  An exceptionally clean, modern geometric sans-serif tuned for dense UI layouts, specification grids, form fields, and readability on all devices.
                </p>
              </div>
            </div>

            {/* Typography scale demo */}
            <div className="bg-stone-100/50 p-6 rounded-lg border border-stone-200">
              <h4 className="text-xs font-sans uppercase font-bold tracking-widest text-stone-500 mb-4">Aesthetic Scale Hierarchy</h4>
              <div className="space-y-4">
                <div className="flex items-baseline border-b border-stone-200/60 pb-3">
                  <span className="w-16 text-[10px] font-mono text-stone-400">H1</span>
                  <h1 className="text-4xl font-display text-stone-900">Showroom Collection</h1>
                </div>
                <div className="flex items-baseline border-b border-stone-200/60 pb-3">
                  <span className="w-16 text-[10px] font-mono text-stone-400">H2</span>
                  <h2 className="text-2xl font-serif text-stone-900 font-semibold">Bridal Masterpieces</h2>
                </div>
                <div className="flex items-baseline border-b border-stone-200/60 pb-3">
                  <span className="w-16 text-[10px] font-mono text-stone-400">H3</span>
                  <h3 className="text-lg font-serif text-stone-800 font-medium">Traditional Jhumkas</h3>
                </div>
                <div className="flex items-baseline border-b border-stone-200/60 pb-3">
                  <span className="w-16 text-[10px] font-mono text-stone-400">Body</span>
                  <p className="text-sm font-sans text-stone-600">The intricate work pays homage to ancient temple motifs.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="w-16 text-[10px] font-mono text-stone-400">Caption</span>
                  <span className="text-[11px] font-sans uppercase tracking-widest text-gold-600 font-bold">ESTD: 1974</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BUTTONS & INTERACTIVE */}
        {activeTab === 'buttons' && (
          <div className="space-y-12 animate-fade-in-up" id="styleguide-buttons">
            <div className="bg-white p-8 rounded-lg border border-stone-200 shadow-sm">
              <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-stone-500 mb-6">Action Button Matrix</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                
                {/* Primary Button */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-stone-400">Primary (Golden/Crimson Blend)</span>
                  <button className="w-full h-11 bg-brand-red-950 text-gold-100 hover:bg-brand-red-900 border border-gold-400/30 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer">
                    <span>Inquire via WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
                  </button>
                </div>

                {/* Secondary Button */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-stone-400">Secondary (Gold Accent)</span>
                  <button className="w-full h-11 bg-transparent hover:bg-gold-50 text-gold-600 hover:text-gold-700 border border-gold-400 hover:border-gold-500 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center gap-2 cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>View Specifications</span>
                  </button>
                </div>

                {/* Accent Filled */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-stone-400">Accent Filled</span>
                  <button className="w-full h-11 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center gap-2 cursor-pointer">
                    <span>Showroom Location</span>
                    <MapPin className="w-3.5 h-3.5 text-gold-300" />
                  </button>
                </div>

                {/* Light Outlined */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-stone-400">Minimal Outline</span>
                  <button className="w-full h-11 bg-transparent hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-300 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center gap-2 cursor-pointer">
                    <span>Request Callback</span>
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            <div className="bg-stone-100/50 p-6 rounded-lg border border-stone-200">
              <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-stone-500 mb-4">Text & Inline Interactive Anchors</h3>
              <div className="flex flex-wrap gap-8 items-center">
                <a href="#link" className="text-xs font-semibold uppercase tracking-wider text-brand-red-950 hover:text-gold-600 transition-colors flex items-center gap-1.5 border-b border-brand-red-950/20 hover:border-gold-500/50 pb-0.5">
                  <span>Browse Heritage Haars</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>

                <a href="#link" className="text-xs font-display font-medium text-stone-800 hover:text-gold-600 transition-colors tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  <span>The Solitaire Collection</span>
                </a>

                {/* Badge Pills */}
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-brand-red-950 text-gold-200 border border-gold-400/20 text-[9px] font-bold tracking-widest uppercase rounded-full">
                    ESTD. 1974
                  </span>
                  <span className="px-3 py-1 bg-gold-100 text-gold-800 border border-gold-300/40 text-[9px] font-bold tracking-widest uppercase rounded-full">
                    22K Hallmarked
                  </span>
                  <span className="px-3 py-1 bg-stone-900 text-stone-100 text-[9px] font-bold tracking-widest uppercase rounded-full">
                    Exclusive Design
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CARDS */}
        {activeTab === 'cards' && (
          <div className="space-y-12 animate-fade-in-up" id="styleguide-cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Product Card Template (Sophisticated, no nested elements, mathematically styled) */}
              <div className="bg-white border border-stone-200 rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-all duration-500 flex flex-col justify-between">
                
                {/* Image Frame */}
                <div className="relative aspect-square bg-stone-100 overflow-hidden flex items-center justify-center">
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-sans">
                    Showroom Masterpiece Photography
                  </span>
                  
                  {/* Real-time Purity Overlay Badge */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                    <span className="px-2.5 py-1 bg-brand-red-950 text-gold-200 text-[9px] font-bold tracking-widest uppercase rounded shadow-sm border border-gold-400/20">
                      Heritage 22K Gold
                    </span>
                  </div>

                  <button 
                    onClick={() => setLiked(!liked)}
                    className="absolute top-4 right-4 w-9 h-9 bg-white hover:bg-stone-50 rounded-full flex items-center justify-center shadow-sm border border-stone-100 text-stone-400 hover:text-brand-red-600 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-brand-red-700 text-brand-red-700' : ''}`} />
                  </button>

                  {/* Aesthetic details placeholder */}
                  <div className="absolute bottom-4 left-4 right-4 bg-stone-950/80 backdrop-blur-xs p-3 border border-stone-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-stone-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-gold-400" />
                      142 Showroom Views
                    </span>
                    <span className="text-gold-400 font-semibold text-[10px] tracking-wider uppercase">Exclusive</span>
                  </div>
                </div>

                {/* Card Specification Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 text-gold-600">
                      <Tag className="w-3 h-3" />
                      <span className="text-[10px] uppercase font-semibold tracking-widest">Antique Chokers</span>
                    </div>

                    <h3 className="font-serif text-lg text-stone-900 group-hover:text-brand-red-950 transition-colors font-semibold leading-snug">
                      Mayur Royal Kundan Choker
                    </h3>

                    <p className="text-stone-500 text-xs font-sans mt-2 line-clamp-2 leading-relaxed">
                      A majestic handcrafted masterpiece depicting divine peacock filigree, embellished with premium Kundan stones and natural south sea pearls.
                    </p>

                    {/* Specification matrix */}
                    <div className="grid grid-cols-2 gap-4 my-4 py-3 border-y border-stone-100 text-[11px] font-sans text-stone-600">
                      <div>
                        <span className="block text-stone-400 font-medium">Gross Weight:</span>
                        <span className="font-semibold text-stone-800">42.850 grams</span>
                      </div>
                      <div>
                        <span className="block text-stone-400 font-medium">Gold Purity:</span>
                        <span className="font-semibold text-stone-800">22 Karat (916)</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex gap-2.5 items-center mt-2">
                    <button className="flex-1 h-9 bg-brand-red-950 hover:bg-brand-red-900 border border-gold-400/20 text-gold-200 hover:text-white text-[10px] font-bold tracking-widest uppercase rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                      <Send className="w-3 h-3" />
                      <span>Inquire Now</span>
                    </button>
                    <button className="h-9 px-3 bg-transparent hover:bg-stone-50 text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 text-[10px] font-bold tracking-widest uppercase rounded transition-colors flex items-center justify-center cursor-pointer">
                      <span>Details</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Informational Showroom Service Card */}
              <div className="bg-cream-100 border border-gold-200/50 rounded-lg p-6 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="w-10 h-10 bg-gold-100 rounded border border-gold-200 flex items-center justify-center text-gold-600 mb-6">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">Heritage Consultations</h3>
                  <p className="text-stone-600 text-xs font-sans leading-relaxed">
                    Schedule a private viewing session at our luxury showroom. Let our heritage jewelry curators assist you in selecting masterpieces tailored to your family heritage.
                  </p>
                </div>

                <div className="mt-8 border-t border-gold-200/40 pt-4 flex items-center justify-between text-xs font-sans font-bold uppercase tracking-widest text-gold-700">
                  <span>ESTD. 1974 TRUST</span>
                  <a href="#booking" className="hover:text-gold-800 flex items-center gap-1">
                    <span>Book Private Seat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Status / Live Rate Dashboard Card */}
              <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-red-950 bg-brand-red-100/50 px-2.5 py-1 rounded">
                      Live Showroom Rate
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated Today
                    </span>
                  </div>

                  <h3 className="font-serif text-lg text-stone-900 font-semibold mb-1">Standard 22K Gold Rate</h3>
                  <p className="text-[10px] text-stone-400 font-sans tracking-wide uppercase">Rate per gram (Kolkata/West Bengal)</p>

                  <div className="my-6">
                    <span className="text-3xl font-display font-medium text-stone-900">₹6,845</span>
                    <span className="text-xs text-stone-500 font-sans ml-1.5">/ gram</span>
                  </div>

                  <div className="space-y-2 text-xs font-sans text-stone-600 border-t border-stone-100 pt-4">
                    <div className="flex justify-between">
                      <span className="text-stone-400">24K Gold Rate:</span>
                      <span className="font-semibold text-stone-800">₹7,467 / g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">18K Gold Rate:</span>
                      <span className="font-semibold text-stone-800">₹5,601 / g</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-[10px] font-bold tracking-widest uppercase rounded transition-colors text-center cursor-pointer">
                    Calculate Jewellery Value
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: FORMS & INPUTS */}
        {activeTab === 'forms' && (
          <div className="space-y-8 animate-fade-in-up" id="styleguide-forms">
            <div className="bg-white p-8 rounded-lg border border-stone-200 shadow-sm max-w-2xl mx-auto">
              <div className="border-b border-stone-100 pb-4 mb-6">
                <span className="text-[10px] text-gold-600 font-display font-bold tracking-widest uppercase block mb-1">
                  Private Catalog Access Request
                </span>
                <h3 className="font-serif text-xl font-normal text-stone-900">Request Showroom Consultation</h3>
              </div>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Full Name
                    </label>
                    <input 
                      type="text"
                      className="w-full h-11 bg-stone-50 hover:bg-stone-100/50 focus:bg-white text-stone-800 border border-stone-200 focus:border-gold-500 text-xs px-3.5 focus:outline-hidden transition-all rounded font-sans"
                      placeholder="e.g. Priyadarshini Sen"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Telephone / WhatsApp
                    </label>
                    <input 
                      type="tel"
                      className="w-full h-11 bg-stone-50 hover:bg-stone-100/50 focus:bg-white text-stone-800 border border-stone-200 focus:border-gold-500 text-xs px-3.5 focus:outline-hidden transition-all rounded font-sans"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                {/* Dropdown Select option */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Heritage Collection of Interest
                  </label>
                  <select className="w-full h-11 bg-stone-50 hover:bg-stone-100/50 focus:bg-white text-stone-800 border border-stone-200 focus:border-gold-500 text-xs px-3.5 focus:outline-hidden transition-all rounded font-sans">
                    <option value="heritage">Bridal Heritage 1974 (Polki & Kundan)</option>
                    <option value="antique">Antique Filigree Gold Masterpieces</option>
                    <option value="diamonds">VVS1 Certified Diamond Solitaires</option>
                    <option value="gold_bangles">Kadas & Handcrafted Bangles</option>
                  </select>
                </div>

                {/* Message text area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Bespoke Customization / Appointment Note
                  </label>
                  <textarea 
                    rows={4}
                    className="w-full bg-stone-50 hover:bg-stone-100/50 focus:bg-white text-stone-800 border border-stone-200 focus:border-gold-500 text-xs p-3.5 focus:outline-hidden transition-all rounded font-sans resize-none"
                    placeholder="Describe any custom gold weight preferences or timing requirements for your bespoke jewelry order..."
                  />
                </div>

                {/* Checkbox item */}
                <div className="flex items-start gap-2.5">
                  <input 
                    type="checkbox"
                    id="consent"
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-brand-red-800 focus:ring-brand-red-700/50"
                    defaultChecked
                  />
                  <label htmlFor="consent" className="text-[10px] text-stone-500 leading-normal font-sans">
                    I prefer receiving real-time valuation updates and photos directly on WhatsApp. I agree to share my details for catalog verification.
                  </label>
                </div>

                {/* Submit action button */}
                <button className="w-full h-11 bg-brand-red-950 text-gold-100 hover:bg-brand-red-900 border border-gold-400/20 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                  <Send className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                  <span>Request Premium Appointment</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Trust & Heritage Disclaimer banner */}
      <div className="mt-16 bg-stone-900 text-stone-200 p-8 rounded-lg border border-stone-800 text-center space-y-3">
        <span className="text-[10px] text-gold-400 font-display font-semibold tracking-widest uppercase block">
          Fine Jewellery Assurance
        </span>
        <h3 className="font-serif text-xl font-normal text-stone-100">Quality Assured Since 1974</h3>
        <p className="text-stone-400 text-xs font-sans max-w-2xl mx-auto leading-relaxed">
          Each masterpiece displayed at Parasmoni Jewellers is BIS Hallmarked (916) and accompanied by physical certification of authenticity. Diamond jewellery includes physical IGI / GIA grading certifications. We uphold strict visual symmetry and material integrity.
        </p>
      </div>
    </div>
  );
}
