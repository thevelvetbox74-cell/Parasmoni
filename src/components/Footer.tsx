/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare, 
  Facebook, 
  Instagram, 
  Youtube, 
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';

export function Footer(): React.JSX.Element {
  const { settings } = useWebsiteSettings();
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings.whatsappMessage)}`;

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-gold-500/20 font-sans" id="main-footer">
      {/* Top Banner / Core Trust Assurance */}
      <div className="bg-stone-950 border-b border-stone-800 py-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left items-center">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-stone-100 uppercase tracking-wider">Showroom Guarantee</h4>
              <p className="text-stone-400 text-xs mt-0.5">100% BIS Hallmarked (916) Sovereign Gold</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-stone-100 uppercase tracking-wider">Bespoke Support</h4>
              <p className="text-stone-400 text-xs mt-0.5">Instant design consultations on WhatsApp</p>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 px-6 bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded items-center gap-2 border border-brand-red-600/10 shadow-md"
            >
              <span>INQUIRE ON WHATSAPP</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gold-300" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Blocks */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* About Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <img 
              src={settings.logoUrl} 
              alt={`${settings.brandName} Logo`} 
              className="h-16 w-auto object-contain rounded-md border border-stone-800 p-1 bg-stone-900"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="font-display text-sm tracking-widest text-stone-100 font-bold leading-tight">
                {settings.brandName.split('&')[0].trim()}
              </span>
              <span className="text-[8px] text-gold-400 tracking-widest font-semibold uppercase">
                {settings.brandName.includes('&') ? '& ' + settings.brandName.split('&').slice(1).join('&').trim() : 'JEWELLERS'}
              </span>
            </div>
          </div>
          <p className="text-stone-400 text-xs leading-relaxed font-serif italic">
            {settings.aboutText || `Established in ${settings.establishedYear}, ${settings.brandName} stands as a hallmark of purity, intricate traditional filigree, and contemporary masterpieces.`}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href={settings.socials.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-brand-red-600 hover:text-white transition-colors flex items-center justify-center text-stone-400">
              <Facebook className="w-4 h-4" />
            </a>
            <a href={settings.socials.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-brand-red-600 hover:text-white transition-colors flex items-center justify-center text-stone-400">
              <Instagram className="w-4 h-4" />
            </a>
            <a href={settings.socials.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-brand-red-600 hover:text-white transition-colors flex items-center justify-center text-stone-400">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="font-serif text-sm font-semibold text-stone-100 uppercase tracking-widest border-l-2 border-gold-500 pl-3">
            Quick Navigation
          </h4>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <Link to="/" className="text-stone-400 hover:text-gold-400 transition-colors flex items-center gap-1.5">
                <span>Showroom Home</span>
              </Link>
            </li>
            <li>
              <Link to="/catalog?focus=collections" className="text-stone-400 hover:text-gold-400 transition-colors flex items-center gap-1.5">
                <span>About Our Heritage</span>
              </Link>
            </li>
            <li>
              <Link to="/stores" className="text-stone-400 hover:text-gold-400 transition-colors flex items-center gap-1.5">
                <span>Our Showroom Locations</span>
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-stone-400 hover:text-gold-400 transition-colors flex items-center gap-1.5">
                <span>Contact Showroom</span>
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-stone-500 hover:text-gold-400 transition-colors flex items-center gap-1.5">
                <span>Staff Portal Login</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Collections */}
        <div className="space-y-4">
          <h4 className="font-serif text-sm font-semibold text-stone-100 uppercase tracking-widest border-l-2 border-gold-500 pl-3">
            Legacy Collections
          </h4>
          <ul className="space-y-2 text-xs font-medium text-stone-400">
            <li>
              <Link to="/catalog?focus=collections" className="hover:text-gold-400 transition-colors block">
                Heritage Bridal Sets
              </Link>
            </li>
            <li>
              <Link to="/catalog?focus=collections" className="hover:text-gold-400 transition-colors block">
                Royal Kundan & Polki
              </Link>
            </li>
            <li>
              <Link to="/catalog?focus=collections" className="hover:text-gold-400 transition-colors block">
                Antique Gold Filigree
              </Link>
            </li>
            <li>
              <Link to="/catalog?focus=collections" className="hover:text-gold-400 transition-colors block">
                IGI Certified Solitaires
              </Link>
            </li>
            <li>
              <Link to="/catalog?focus=collections" className="hover:text-gold-400 transition-colors block">
                Heavy Kadas & Bangles
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 text-xs">
          <h4 className="font-serif text-sm font-semibold text-stone-100 uppercase tracking-widest border-l-2 border-gold-500 pl-3">
            Showroom Contact
          </h4>
          <div className="space-y-3 font-medium">
            <div className="flex gap-3 text-stone-400">
              <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{settings.address}</span>
            </div>
            <div className="flex gap-3 text-stone-400 items-center">
              <Phone className="w-4 h-4 text-gold-500 shrink-0" />
              <span>{settings.contactNumber}</span>
            </div>
            <div className="flex gap-3 text-stone-400 items-center">
              <Mail className="w-4 h-4 text-gold-500 shrink-0" />
              <span>{settings.emailAddress}</span>
            </div>
            <div className="flex gap-3 text-stone-400">
              <Clock className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
              <span>{settings.workingHours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Disclaimer */}
      <div className="bg-stone-950 text-stone-500 py-6 px-6 text-center text-xs border-t border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {settings.brandName.toUpperCase()} — ESTD: {settings.establishedYear}. All Rights Reserved.</p>
          <p className="text-[10px] text-stone-600">
            BIS Hallmarked Gold Jewellery • Real-time valuation transparency strictly upheld.
          </p>
        </div>
      </div>
    </footer>
  );
}
