/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Gem,
  User,
  PhoneCall,
  FileText
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { mockWebsiteSettings } from '../data/mockSettings';

export function Contact(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  
  // Try to retrieve prefilled product code or sku from search params
  const initialProductCode = searchParams.get('code') || searchParams.get('productCode') || searchParams.get('sku') || '';

  // State managers
  const [settings, setSettings] = useState<any>(mockWebsiteSettings);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    productCode: initialProductCode
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 1. Fetch contact info from websiteSettings in Firestore
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settingsCol = collection(db, 'websiteSettings');
        const settingsSnapshot = await getDocs(settingsCol);
        if (!settingsSnapshot.empty) {
          const docData = settingsSnapshot.docs[0].data();
          setSettings({
            ...mockWebsiteSettings,
            ...docData,
            contactNumber: docData.contactPhone || docData.contactNumber || docData.phone || mockWebsiteSettings.contactNumber,
            whatsappNumber: docData.whatsappNumber || mockWebsiteSettings.whatsappNumber,
            emailAddress: docData.emailAddress || docData.contactEmail || docData.email || mockWebsiteSettings.emailAddress,
            address: docData.address || mockWebsiteSettings.address,
            workingHours: docData.workingHours || mockWebsiteSettings.workingHours
          });
        }
      } catch (err) {
        console.warn("Could not retrieve active websiteSettings from database. Applying mock fallbacks.", err);
      }
    }
    fetchSettings();
  }, []);

  // Update productCode if query parameter changes dynamically
  useEffect(() => {
    if (initialProductCode) {
      setFormData(prev => ({ ...prev, productCode: initialProductCode }));
    }
  }, [initialProductCode]);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Form Validation
  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      tempErrors.name = "Full name is required";
    }
    
    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else {
      const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        tempErrors.phone = "Please enter a valid 10-digit phone number";
      }
    }
    
    if (!formData.email.trim()) {
      tempErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        tempErrors.email = "Please enter a valid email address";
      }
    }
    
    if (!formData.message.trim()) {
      tempErrors.message = "Message or inquiry details are required";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const enquiriesCol = collection(db, 'enquiries');
      await addDoc(enquiriesCol, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        message: formData.message.trim(),
        productCode: formData.productCode.trim() || null,
        status: "new",
        createdAt: new Date().toISOString()
      });

      setSubmitSuccess(true);
      // Reset form (except productCode if prefilled originally)
      setFormData({
        name: '',
        phone: '',
        email: '',
        message: '',
        productCode: initialProductCode
      });
    } catch (err: any) {
      console.error("Failed to submit showroom enquiry", err);
      setSubmitError(err.message || "An unexpected error occurred while saving your inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Link Formulation
  const getWhatsAppLink = () => {
    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    let text = settings.whatsappMessage || "Hello Parasmoni Jewellers, I would like to inquire about your collections.";
    if (formData.productCode) {
      text = `Hello Parasmoni Jewellers, I am interested in product code: ${formData.productCode}. Please share availability and details.`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 font-sans" id="showroom-contact-page">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Title Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] text-amber-700 font-bold tracking-widest uppercase block">Connect with our Artisans</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-wide">
            Inquire & Consultation
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
            Have questions about our signature works, custom jewellery designs, or want to schedule a virtual showroom tour? Reach out directly.
          </p>
        </div>

        {/* Primary Contact Channels Strip (Top Highlights) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto" id="primary-contact-ctas">
          {/* WhatsApp Direct */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-stone-50 text-xs font-bold tracking-widest uppercase transition-colors rounded p-4 shadow-xs cursor-pointer text-center"
            id="whatsapp-direct-btn"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <div>
              <span className="block text-left text-[9px] text-emerald-200 font-normal normal-case">Direct Artisan Link</span>
              <span className="block">WhatsApp Chat</span>
            </div>
          </a>

          {/* Hotline Dial */}
          <a
            href={`tel:${settings.contactNumber.replace(/[^0-9+]/g, '')}`}
            className="flex items-center justify-center gap-3 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-bold tracking-widest uppercase transition-colors rounded p-4 cursor-pointer text-center"
            id="phone-direct-btn"
          >
            <Phone className="w-4.5 h-4.5 text-amber-400" />
            <div>
              <span className="block text-left text-[9px] text-stone-400 font-normal normal-case">Flagship Helpline</span>
              <span className="block">Call Showroom Now</span>
            </div>
          </a>
        </div>

        {/* Core Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-stone-200/80 rounded overflow-hidden p-6 sm:p-10 shadow-xs">
          
          {/* Column A: Contact Information Panel (5/12) */}
          <div className="lg:col-span-5 space-y-8 lg:pr-8 lg:border-r lg:border-stone-100" id="contact-info-panel">
            <div className="space-y-2">
              <span className="text-[10px] text-amber-700 font-bold tracking-widest uppercase block">Our Office</span>
              <h3 className="font-serif text-lg font-bold text-stone-900">Showroom Details</h3>
              <p className="text-stone-500 text-xs leading-relaxed font-sans">
                Visit our signature locations in Kolkata for comprehensive consultations, real-time bullion estimations, and personalized customizations.
              </p>
            </div>

            {/* Spec Contact Info blocks */}
            <div className="space-y-5 text-xs text-stone-600">
              
              {/* Address */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200/50">
                  <MapPin className="w-4 h-4 text-stone-700" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] mb-1">Showroom Address</h4>
                  <p className="leading-relaxed font-sans">{settings.address}</p>
                </div>
              </div>

              {/* Telephone */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200/50">
                  <PhoneCall className="w-4 h-4 text-stone-700" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] mb-1">Customer Helpline</h4>
                  <a href={`tel:${settings.contactNumber}`} className="font-mono text-stone-950 font-semibold hover:text-amber-700 transition-colors">
                    {settings.contactNumber}
                  </a>
                </div>
              </div>

              {/* Email Address */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200/50">
                  <Mail className="w-4 h-4 text-stone-700" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] mb-1">Electronic Mail</h4>
                  <a href={`mailto:${settings.emailAddress}`} className="font-sans text-stone-950 font-semibold hover:text-amber-700 transition-colors">
                    {settings.emailAddress}
                  </a>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200/50">
                  <Clock className="w-4 h-4 text-stone-700" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] mb-1">Business Hours</h4>
                  <p className="font-sans leading-relaxed">{settings.workingHours}</p>
                </div>
              </div>

            </div>

            {/* Quality seal */}
            <div className="p-4 bg-amber-50/50 border border-amber-500/10 rounded flex items-start gap-3">
              <Gem className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">Bespoke Design Requests</h4>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">
                  Have a specific sketch or reference? Include the details in your message. Our expert artisans specialize in recreating custom bridal heirlooms, antique works, and lightweight designer pieces.
                </p>
              </div>
            </div>
          </div>

          {/* Column B: Enquiry Submission Form (7/12) */}
          <div className="lg:col-span-7 space-y-6" id="contact-form-pane">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-stone-900">Send an Enquiry</h3>
              <p className="text-stone-500 text-xs">Fill out the form below, and our dedicated customer relationship team will reach out to you within 24 business hours.</p>
            </div>

            {/* Submit Notification Cards */}
            {submitSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-500/20 text-emerald-900 rounded flex items-start gap-3" id="enquiry-success-alert">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold uppercase tracking-wider text-[10px]">Enquiry Submitted Successfully!</h4>
                  <p className="leading-relaxed">
                    Thank you for your interest in Parasmoni Jewellers. Your showroom inquiry has been securely logged under status **"New"**. Our jewelry experts will contact you shortly.
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-red-50 border border-red-500/20 text-red-900 rounded flex items-start gap-3" id="enquiry-error-alert">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold uppercase tracking-wider text-[10px]">Submission Failed</h4>
                  <p className="leading-relaxed">{submitError}</p>
                </div>
              </div>
            )}

            {/* The Form Element */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs" id="showroom-enquiry-form">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label htmlFor="name-input" className="font-bold text-stone-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <User className="w-3 h-3 text-stone-400" />
                    <span>Your Name <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    id="name-input"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`w-full bg-stone-50 text-stone-850 p-3 rounded border focus:outline-hidden focus:bg-white transition-all ${
                      errors.name ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-amber-600'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-medium">{errors.name}</p>}
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label htmlFor="phone-input" className="font-bold text-stone-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>Phone Number <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    id="phone-input"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full bg-stone-50 text-stone-850 p-3 rounded border focus:outline-hidden focus:bg-white transition-all ${
                      errors.phone ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-amber-600'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div className="space-y-1">
                  <label htmlFor="email-input" className="font-bold text-stone-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-400" />
                    <span>Email Address <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="email"
                    id="email-input"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className={`w-full bg-stone-50 text-stone-850 p-3 rounded border focus:outline-hidden focus:bg-white transition-all ${
                      errors.email ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-amber-600'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email}</p>}
                </div>

                {/* Product Code (Optional, Prefillable) */}
                <div className="space-y-1">
                  <label htmlFor="productCode-input" className="font-bold text-stone-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <FileText className="w-3 h-3 text-stone-400" />
                    <span>Product Code <span className="text-stone-400 font-normal italic">(Optional)</span></span>
                  </label>
                  <input
                    type="text"
                    id="productCode-input"
                    name="productCode"
                    value={formData.productCode}
                    onChange={handleInputChange}
                    placeholder="e.g. PM-GOLD-SET-01"
                    className="w-full bg-stone-50 text-stone-850 p-3 rounded border border-stone-200 focus:outline-hidden focus:border-amber-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label htmlFor="message-input" className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                  Message / Inquiry Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message-input"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Describe what you are looking for (e.g. metal purity, weight preferences, design customization requests, or timeline)"
                  className={`w-full bg-stone-50 text-stone-850 p-3 rounded border focus:outline-hidden focus:bg-white transition-all resize-y ${
                    errors.message ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-amber-600'
                  }`}
                />
                {errors.message && <p className="text-[10px] text-red-500 font-medium">{errors.message}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-stone-50 text-xs font-bold tracking-widest uppercase transition-colors rounded py-3.5 cursor-pointer"
                id="submit-enquiry-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-100 border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Enquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Enquiry</span>
                  </>
                )}
              </button>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
