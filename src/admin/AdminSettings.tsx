/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { 
  Building2, 
  Settings, 
  Phone, 
  Mail, 
  Clock, 
  Globe, 
  Save, 
  X, 
  Check, 
  Facebook, 
  Instagram, 
  Youtube, 
  Share2, 
  Info,
  Sliders,
  Sparkles
} from 'lucide-react';

export function AdminSettings(): React.JSX.Element {
  const { settings: globalSettings } = useWebsiteSettings();
  const [docId, setDocId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [establishedYear, setEstablishedYear] = useState<number>(1974);
  const [logoUrl, setLogoUrl] = useState('');
  const [favicon, setFavicon] = useState('/favicon.ico');
  const [aboutText, setAboutText] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [address, setAddress] = useState('');
  const [customerCareNumber, setCustomerCareNumber] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [footerText, setFooterText] = useState('');
  
  // Social Links
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [pinterest, setPinterest] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load live values from Firestore
  useEffect(() => {
    async function loadSettingsDoc() {
      try {
        setLoading(true);
        if (!isFirebaseConfigured || !db) {
          // Fallback to globalSettings state from context
          populateState(globalSettings, 'mock-doc-id');
          setLoading(false);
          return;
        }

        const settingsCol = collection(db, 'websiteSettings');
        const snapshot = await getDocs(settingsCol);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setDocId(docSnap.id);
          const data = docSnap.data();
          populateState(data, docSnap.id);
        } else {
          // Pre-populate with current context settings
          populateState(globalSettings, null);
        }
      } catch (err: any) {
        console.error('Error fetching websiteSettings doc:', err);
        setErrorMsg('Failed to fetch website settings from Firestore.');
      } finally {
        setLoading(false);
      }
    }

    loadSettingsDoc();
  }, [globalSettings]);

  const populateState = (data: any, id: string | null) => {
    if (id) setDocId(id);
    setBrandName(data.brandName || data.showroomName || 'Parasmoni Jewellers & Brothers');
    setTagline(data.tagline || 'Purity & Craftsmanship Passed Through Generations');
    setEstablishedYear(Number(data.establishedYear || 1974));
    setLogoUrl(data.logoUrl || data.logo || 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/branding/parasmoni_logo.png');
    setFavicon(data.favicon || '/favicon.ico');
    setAboutText(data.aboutText || 'Established in 1974, Parasmoni Jewellers stands as a hallmark of purity, traditional filigree, and contemporary masterpieces.');
    setContactNumber(data.contactNumber || data.contactPhone || data.primaryPhone || data.phone || '+91 33 2241 9876');
    setWhatsappNumber(data.whatsappNumber || '+91 9831023456');
    setWhatsappMessage(data.whatsappMessage || 'Hello! I would like to inquire about certified gold showroom jewellery.');
    setEmailAddress(data.emailAddress || data.contactEmail || data.email || 'info@parasmoni.in');
    setAddress(data.address || '123, Bowbazar Street, Kolkata - 700012, West Bengal, India');
    setCustomerCareNumber(data.customerCareNumber || data.contactPhone || '+91 33 2241 9876');
    setGoogleMapUrl(data.googleMapUrl || data.googleMapsUrl || 'https://maps.google.com/?q=Bowbazar+Kolkata');
    setGoogleMapsEmbed(data.googleMapsEmbed || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.1481119779313!2d88.35850937584102!3d22.573531479491742!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0277ab360df89d%3A0xc6c4295fa9578168!2sBowbazar%2C%20Kolkata%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1787646387697!5m2!1sen!2sin');
    setWorkingHours(data.workingHours || data.openingHours || 'Monday - Saturday: 11:30 AM - 8:00 PM (Weekly Off: Sunday)');
    setFooterText(data.footerText || '© 2026 Parasmoni Jewellers & Brothers. All Rights Reserved.');
    
    const socialsData = data.socials || data.socialMediaLinks || {};
    setFacebook(socialsData.facebook || 'https://facebook.com');
    setInstagram(socialsData.instagram || 'https://instagram.com');
    setYoutube(socialsData.youtube || 'https://youtube.com');
    setPinterest(socialsData.pinterest || 'https://pinterest.com');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      brandName,
      tagline,
      establishedYear: Number(establishedYear),
      logoUrl,
      logo: logoUrl, // duplicate
      favicon,
      aboutText,
      contactNumber,
      contactPhone: contactNumber, // duplicate
      primaryPhone: contactNumber, // duplicate
      phone: contactNumber, // duplicate
      whatsappNumber,
      whatsappMessage,
      emailAddress,
      contactEmail: emailAddress, // duplicate
      email: emailAddress, // duplicate
      address,
      customerCareNumber,
      googleMapUrl,
      googleMapsUrl: googleMapUrl, // duplicate
      googleMapsEmbed,
      workingHours,
      openingHours: workingHours, // duplicate
      footerText,
      socials: {
        facebook,
        instagram,
        youtube,
        pinterest
      },
      socialMediaLinks: {
        facebook,
        instagram,
        youtube,
        pinterest
      },
      updatedAt: new Date().toISOString()
    };

    try {
      if (!isFirebaseConfigured || !db) {
        setSuccessMsg('Branding variables saved to emulated frontend context!');
        setSubmitting(false);
        return;
      }

      const settingsCol = collection(db, 'websiteSettings');
      if (docId && !docId.startsWith('mock-')) {
        // Update document
        const docRef = doc(db, 'websiteSettings', docId);
        await updateDoc(docRef, payload);
        setSuccessMsg('Showroom configurations and branding updated in real-time!');
      } else {
        // Add document
        const ref = await addDoc(settingsCol, payload);
        setDocId(ref.id);
        setSuccessMsg('Initial branding registry created successfully!');
      }
    } catch (err: any) {
      console.error('Error updating settings document:', err);
      setErrorMsg(err.message || 'Failed to save settings variables to database.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3" id="settings-loader">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 tracking-wider font-mono">Retrieving core system configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="admin-branding-configurations">
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-serif font-bold text-stone-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" />
          <span>Website Configurations</span>
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          Administer sitewide logos, support direct-lines, social profiles, and default communication payloads.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded flex items-center gap-2" id="settings-success">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/25 border border-red-500/20 text-red-400 text-xs rounded flex items-center gap-2" id="settings-error">
          <X className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6" id="settings-form">
        <div className="bg-stone-900/40 border border-stone-800 rounded p-6 space-y-6">
          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-300 border-b border-stone-850 pb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Identity & Logos</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Tagline / Brand Eyebrow
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Established Year
                </label>
                <input
                  type="number"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(parseInt(e.target.value) || 1974)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Official Showroom Logo (ImageKit)
                </label>
                <ImageUploader
                  id="branding-logo-uploader"
                  value={logoUrl}
                  onChange={(val) => setLogoUrl(val as string)}
                  folder={IMAGEKIT_FOLDERS.branding}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Browser Favicon URL
                </label>
                <input
                  type="text"
                  value={favicon}
                  onChange={(e) => setFavicon(e.target.value)}
                  placeholder="/favicon.ico"
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
                <p className="text-[9px] text-stone-500 leading-relaxed">
                  Relative or absolute path pointing to the browser tab icon. Defaults to standard /favicon.ico.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Numbers & Hours */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-300 border-b border-stone-850 pb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-amber-500" />
              <span>Contact Coordinates</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Primary Contact Phone
                </label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Customer Care Support
                </label>
                <input
                  type="text"
                  value={customerCareNumber}
                  onChange={(e) => setCustomerCareNumber(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  WhatsApp Direct Booking Number
                </label>
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+91 9831023456"
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
                <p className="text-[9px] text-stone-500">
                  Must include country code (e.g. +91) without spacing for instant browser messaging triggers.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  WhatsApp Greeting Payload
                </label>
                <input
                  type="text"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
                <p className="text-[9px] text-stone-500">
                  Pre-filled text that populates the user's chat window when they click inquire.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Showroom Physical parameters */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-300 border-b border-stone-850 pb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Location, Hours & Embeds</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Head Office Registered Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Standard Working Hours Text
                </label>
                <textarea
                  rows={2}
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Google Maps Location Link
                </label>
                <input
                  type="text"
                  value={googleMapUrl}
                  onChange={(e) => setGoogleMapUrl(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Google Maps Embed Link <span className="text-stone-500">(src URL only)</span>
                </label>
                <input
                  type="text"
                  value={googleMapsEmbed}
                  onChange={(e) => setGoogleMapsEmbed(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                Brand Heritage Description <span className="text-stone-500">(About Us Text)</span>
              </label>
              <textarea
                rows={3}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Section 4: Social media & Footer */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-300 border-b border-stone-850 pb-2 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-amber-500" />
              <span>Social Media Handles & Footer Copy</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block flex items-center gap-1">
                  <Facebook className="w-3 h-3 text-blue-500" />
                  <span>Facebook Profile</span>
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-500" />
                  <span>Instagram Feed</span>
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block flex items-center gap-1">
                  <Youtube className="w-3 h-3 text-red-500" />
                  <span>Youtube Channel</span>
                </label>
                <input
                  type="text"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                  Pinterest Board
                </label>
                <input
                  type="text"
                  value={pinterest}
                  onChange={(e) => setPinterest(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-bold block">
                Footer Copyright Text
              </label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-stone-950 text-xs font-bold uppercase tracking-wider rounded shadow-md transition-all cursor-pointer font-sans"
            id="save-settings-btn"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Publishing Configurations...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 shrink-0" />
                <span>Save & Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
