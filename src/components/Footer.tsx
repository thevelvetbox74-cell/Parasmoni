/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Dynamic, Customized Footer Component
 */

import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  Edit,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { DEFAULT_FOOTER_CONFIG, FooterConfig } from '../data/defaultFooterConfig';

export interface FooterProps {
  isBuilder?: boolean;
  customBgColor?: string;
  customConfig?: FooterConfig; // Optional direct inject from builder
  onFooterClick?: () => void;
}

// 1. Safe Icon Helper Component to render preset or custom SVG
function SafeIconRenderer({ 
  type, 
  useCustomIcon, 
  customIconSvg, 
  className = "w-4 h-4 text-amber-500" 
}: { 
  type: string; 
  useCustomIcon?: boolean; 
  customIconSvg?: string; 
  className?: string; 
}) {
  if (useCustomIcon && customIconSvg) {
    return (
      <span 
        className={`flex items-center justify-center ${className}`}
        dangerouslySetInnerHTML={{ __html: customIconSvg }}
      />
    );
  }

  const iconProps = { className };
  switch (type) {
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.528 1.967 14.069 1.9 12.012 1.9c-5.439 0-9.865 4.371-9.869 9.8.001 2.122.56 4.195 1.624 6.002L2.73 21.284l3.917-1.43z" />
        </svg>
      );
    case 'email':
      return <Mail {...iconProps} />;
    case 'chat':
      return <MessageSquare {...iconProps} />;
    case 'instagram':
      return <Instagram {...iconProps} />;
    case 'facebook':
      return <Facebook {...iconProps} />;
    case 'youtube':
      return <Youtube {...iconProps} />;
    case 'pinterest':
      return <Compass {...iconProps} />;
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return <Compass {...iconProps} />;
  }
}

export function Footer({ isBuilder = false, customBgColor, customConfig, onFooterClick }: FooterProps): React.JSX.Element {
  const { settings } = useWebsiteSettings();
  const [isMobile, setIsMobile] = useState(false);
  const [openColumnId, setOpenColumnId] = useState<string | null>(null);

  // Master local config merged with defaults
  const [config, setConfig] = useState<FooterConfig>({
    ...DEFAULT_FOOTER_CONFIG,
    // dynamically bind fallback showroom information
    contactColumn: {
      ...DEFAULT_FOOTER_CONFIG.contactColumn,
      primaryPhone: settings.contactNumber || '1800-296-6677',
      secondaryPhone: settings.whatsappNumber || '+91 8147349242'
    }
  });

  // Responsive layout detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen / Fetch real-time settings
  useEffect(() => {
    // If a direct config is passed down from builder editor, use it immediately
    if (customConfig) {
      setConfig(customConfig);
      return;
    }

    if (!isFirebaseConfigured || !db) {
      // Local fallback
      const cached = localStorage.getItem('website_footer_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setConfig(prev => ({
            ...prev,
            ...parsed,
            contactColumn: { ...prev.contactColumn, ...parsed.contactColumn },
            socialRow: { ...prev.socialRow, ...parsed.socialRow },
            copyright: { ...prev.copyright, ...parsed.copyright },
            spacing: { ...prev.spacing, ...parsed.spacing }
          }));
        } catch (e) {
          console.error('Error parsing local footer cache:', e);
        }
      }
      return;
    }

    const docRef = doc(db, 'websiteSettings', 'footer');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<FooterConfig>;
        if (data) {
          setConfig(prev => ({
            ...prev,
            ...data,
            contactColumn: { ...prev.contactColumn, ...data.contactColumn },
            socialRow: { ...prev.socialRow, ...data.socialRow },
            copyright: { ...prev.copyright, ...data.copyright },
            spacing: { ...prev.spacing, ...data.spacing }
          }));
        }
      }
    }, (error) => {
      console.warn('Fallback syncing for websiteSettings/footer:', error);
    });

    return () => unsubscribe();
  }, [customConfig, settings]);

  // Collapsible toggle for mobile
  const toggleMobileColumn = (colId: string) => {
    if (openColumnId === colId) {
      setOpenColumnId(null);
    } else {
      setOpenColumnId(colId);
    }
  };

  // Derive phone and links properly
  const primaryPhoneToDisplay = config.contactColumn.primaryPhoneOverride
    ? config.contactColumn.primaryPhone
    : (settings.contactNumber || config.contactColumn.primaryPhone);

  const secondaryPhoneToDisplay = config.contactColumn.secondaryPhone || settings.whatsappNumber;

  const finalBgColor = customBgColor || config.backgroundColor || '#2D0B0A';
  const clipPathId = isMobile ? 'url(#footer-arch-clip-mobile)' : 'url(#footer-arch-clip)';

  const isBottomFlat = config.bottomFlat ?? true;
  const strokeColor = config.borderColor || '#b58b37';
  const strokeWidth = config.borderThickness ?? 4;

  const dDesktop = isBottomFlat
    ? "M 0,0.06 C 0.1,-0.01, 0.4,-0.01, 0.5,0.06 C 0.6,-0.01, 0.9,-0.01, 1,0.06 L 1,1 L 0,1 Z"
    : "M 0,0.06 C 0.1,-0.01, 0.4,-0.01, 0.5,0.06 C 0.6,-0.01, 0.9,-0.01, 1,0.06 L 1,0.94 C 0.9,1.01, 0.6,1.01, 0.5,0.94 C 0.4,1.01, 0.1,1.01, 0,0.94 Z";

  const dMobile = isBottomFlat
    ? "M 0,0.03 C 0.1,0.005, 0.4,0.005, 0.5,0.03 C 0.6,0.005, 0.9,0.005, 1,0.03 L 1,1 L 0,1 Z"
    : "M 0,0.03 C 0.1,0.005, 0.4,0.005, 0.5,0.03 C 0.6,0.005, 0.9,0.005, 1,0.03 L 1,0.97 C 0.9,0.995, 0.6,0.995, 0.5,0.97 C 0.4,0.995, 0.1,0.995, 0,0.97 Z";

  return (
    <div className={`relative ${isBuilder ? 'cursor-pointer group/footer' : ''}`} onClick={isBuilder ? onFooterClick : undefined}>
      
      {/* A. SVG Clip Paths */}
      <svg className="absolute w-0 h-0" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <clipPath id="footer-arch-clip" clipPathUnits="objectBoundingBox">
            <path d={dDesktop} />
          </clipPath>
          <clipPath id="footer-arch-clip-mobile" clipPathUnits="objectBoundingBox">
            <path d={dMobile} />
          </clipPath>
        </defs>
      </svg>

      {/* B. Admin Visual Banner */}
      {isBuilder && (
        <div className="absolute inset-x-0 -top-4 flex justify-center z-50 pointer-events-none transition-all duration-300 opacity-0 group-hover/footer:opacity-100 animate-fade-in">
          <div className="bg-amber-600 text-stone-950 px-3.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full shadow-lg flex items-center gap-1.5 border border-amber-400">
            <Edit className="w-3 h-3" />
            <span>Click Footer to Open Full Customizer Tool</span>
          </div>
        </div>
      )}

      {/* C. Styled Footer Container */}
      <footer 
        className={`${config.globalFontFamily} relative overflow-hidden transition-all duration-500 pt-16 md:pt-24 pb-12 md:pb-16 px-6`} 
        id="main-footer"
        style={{ 
          clipPath: clipPathId, 
          backgroundColor: finalBgColor,
          color: config.globalTextColor
        }}
      >
        {/* Curved Gold Outline Tracer Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {isMobile ? (
            <>
              <path d="M 0,30 C 100,5, 400,5, 500,30 C 600,5, 900,5, 1000,30" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" opacity="0.8" />
              {isBottomFlat ? (
                <path d="M 0,1000 L 1000,1000" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" opacity="0.8" />
              ) : (
                <path d="M 1000,970 C 900,995, 600,995, 500,970 C 400,995, 100,995, 0,970" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" opacity="0.8" />
              )}
            </>
          ) : (
            <>
              <path d="M 0,60 C 100,-10, 400,-10, 500,60 C 600,-10, 900,-10, 1000,60" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" opacity="0.9" />
              {isBottomFlat ? (
                <path d="M 0,1000 L 1000,1000" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" opacity="0.9" />
              ) : (
                <path d="M 1000,940 C 900,1010, 600,1010, 500,940 C 400,1010, 100,1010, 0,940" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" opacity="0.9" />
              )}
            </>
          )}
        </svg>

        {/* Dynamic Spaced Layout Outer Wrapper */}
        <div className={`max-w-7xl mx-auto ${config.spacing.rowSpacing} relative z-20`}>

          {/* SECTION 1: Brand Grid, Multi-columns, Contact Column */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 ${config.spacing.columnGap}`}>
            
            {/* 1.1 BRAND LOGO BLOCK & APP DOWNLOAD BLOCK */}
            {((config.logoUrl || settings.logoUrl || settings.brandName) || settings.aboutText || (config.showAppBlock && (config.qrCodeUrl || config.playStoreBadgeUrl || config.appStoreBadgeUrl))) && (
              <div className="lg:col-span-4 space-y-6">
                {/* Brand Header */}
                {(config.logoUrl || settings.logoUrl || settings.brandName) && (
                  <div className="flex items-center gap-4">
                    {(config.logoUrl || settings.logoUrl) && (
                      <img 
                        src={(config.logoUrl || settings.logoUrl) || undefined} 
                        alt={`${settings.brandName || 'Brand'} Logo`} 
                        className="h-16 w-auto object-contain rounded-md border border-stone-800 p-1 bg-stone-900/60 shadow-inner"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {settings.brandName && (
                      <div className="flex flex-col">
                        <span className="font-serif text-sm tracking-widest text-stone-100 font-bold leading-tight">
                          {settings.brandName.split('&')[0].trim()}
                        </span>
                        {settings.brandName.includes('&') ? (
                          <span className="text-[9px] text-gold-400 tracking-widest font-semibold uppercase font-mono mt-0.5">
                            & {settings.brandName.split('&').slice(1).join('&').trim()}
                          </span>
                        ) : (
                          <span className="text-[9px] text-gold-400 tracking-widest font-semibold uppercase font-mono mt-0.5">
                            JEWELLERS
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Showroom Description */}
                {settings.aboutText && (
                  <p className="text-xs leading-relaxed font-serif italic text-stone-400 max-w-sm">
                    {settings.aboutText}
                  </p>
                )}

                {/* Download App Module */}
                {config.showAppBlock && (config.qrCodeUrl || config.playStoreBadgeUrl || config.appStoreBadgeUrl) && (
                  <div className="pt-4 border-t border-stone-800/60 space-y-4">
                    {config.appBlockTitle && (
                      <h5 
                        className={`${config.appBlockTitleFontFamily || 'font-serif'} ${config.appBlockTitleFontSize || 'text-xs'} font-bold tracking-wider`}
                        style={{ color: config.appBlockTitleColor || '#f59e0b' }}
                      >
                        {config.appBlockTitle}
                      </h5>
                    )}

                    {/* QR & App Stores flex row */}
                    <div className="flex items-center gap-4">
                      {/* QR Code */}
                      {config.qrCodeUrl && (
                        <div className="p-1.5 bg-white rounded border border-stone-800 shrink-0 select-none">
                          <img 
                            src={config.qrCodeUrl} 
                            alt="Download App QR Code" 
                            className="w-16 h-16 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* App Store Triggers */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {config.playStoreBadgeUrl && (
                          <a 
                            href={config.playStoreLink || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block hover:opacity-80 transition-all active:scale-95 touch-manipulation min-h-[38px]"
                            title="Get it on Google Play"
                          >
                            <img 
                              src={config.playStoreBadgeUrl} 
                              alt="Google Play" 
                              className="h-[34px] w-auto"
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        )}
                        {config.appStoreBadgeUrl && (
                          <a 
                            href={config.appStoreLink || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block hover:opacity-80 transition-all active:scale-95 touch-manipulation min-h-[38px]"
                            title="Download on the App Store"
                          >
                            <img 
                              src={config.appStoreBadgeUrl} 
                              alt="App Store" 
                              className="h-[34px] w-auto"
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1.2 MULTI-COLUMN LINK LISTS (with Mobile Collapsible Accordion logic) */}
            {config.columns && config.columns
              .filter(column => column.title && column.links && column.links.filter(link => link.label && link.url).length > 0)
              .map((column) => {
                const isColOpen = openColumnId === column.id;
                const validLinks = column.links.filter(link => link.label && link.url);
                return (
                  <div key={column.id} className="lg:col-span-2 space-y-4">
                    {/* Column Header (Clickable on Mobile for Accordion) */}
                    <div 
                      onClick={() => isMobile && toggleMobileColumn(column.id)}
                      className="flex items-center justify-between border-b md:border-b-0 border-stone-800/40 pb-2 md:pb-0 cursor-pointer md:cursor-default select-none group/col"
                    >
                      <h4 
                        className={`${column.titleFontFamily || 'font-serif'} ${column.titleFontSize || 'text-sm'} font-semibold uppercase tracking-widest border-l-2 border-gold-500 pl-3`}
                        style={{ color: column.titleColor || '#ffffff' }}
                      >
                        {column.title}
                      </h4>
                      {isMobile && (
                        <span className="text-stone-400 group-hover/col:text-amber-500 transition-colors">
                          {isColOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      )}
                    </div>

                    {/* Links list */}
                    <ul className={`space-y-3.5 text-xs font-medium transition-all duration-300 ${
                      isMobile && !isColOpen ? 'hidden' : 'block'
                    }`}>
                      {validLinks.map((link) => (
                        <li key={link.id}>
                          <Link 
                            to={link.url} 
                            className="hover:text-gold-400 transition-colors flex items-center gap-1.5 leading-normal min-h-[36px] md:min-h-0"
                            style={{ 
                              fontFamily: column.linkFontFamily || config.globalFontFamily,
                              fontSize: column.linkFontSize,
                              color: column.linkColor || config.globalTextColor
                            }}
                          >
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

            {/* 1.3 THE "CONTACT US" SHOWROOM DETAILS COLUMN */}
            {(primaryPhoneToDisplay || secondaryPhoneToDisplay || (config.contactColumn.icons && config.contactColumn.icons.length > 0)) && (
              <div className="lg:col-span-4 space-y-4 text-xs">
                {config.contactColumn.title && (
                  <h4 
                    className={`${config.contactColumn.titleFontFamily || 'font-serif'} ${config.contactColumn.titleFontSize || 'text-sm'} font-semibold uppercase tracking-widest border-l-2 border-gold-500 pl-3`}
                    style={{ color: config.contactColumn.titleColor || '#ffffff' }}
                  >
                    {config.contactColumn.title}
                  </h4>
                )}

                <div className="space-y-4 font-medium pt-1">
                  {/* Primary Contact phone */}
                  {primaryPhoneToDisplay && (
                    <div className="flex gap-3 text-stone-400 min-h-[36px] md:min-h-0 items-center">
                      <div className="w-9 h-9 rounded-full bg-stone-900/60 border border-stone-800/80 flex items-center justify-center text-amber-500 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-mono tracking-wider text-stone-500">Call Showroom</span>
                        <span className="text-stone-100 font-bold">{primaryPhoneToDisplay}</span>
                      </div>
                    </div>
                  )}

                  {/* Secondary Chat number */}
                  {secondaryPhoneToDisplay && (
                    <div className="flex gap-3 text-stone-400 min-h-[36px] md:min-h-0 items-center">
                      <div className="w-9 h-9 rounded-full bg-stone-900/60 border border-stone-800/80 flex items-center justify-center text-amber-500 shrink-0">
                        <SafeIconRenderer type="whatsapp" className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-mono tracking-wider text-stone-500">{config.contactColumn.chatWithUsLabel || 'Chat with Us'}</span>
                        <span className="text-stone-100 font-bold">{secondaryPhoneToDisplay}</span>
                      </div>
                    </div>
                  )}

                  {/* Circular Action Icons */}
                  {config.contactColumn.icons && config.contactColumn.icons.length > 0 && (
                    <div className="flex items-center gap-3 pt-2">
                      {config.contactColumn.icons.map((icon) => {
                        // Compose actions
                        let finalUrl = icon.url;
                        if (!finalUrl) {
                          if (icon.type === 'whatsapp') {
                            if (!secondaryPhoneToDisplay) return null;
                            finalUrl = `https://wa.me/${secondaryPhoneToDisplay.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings.whatsappMessage || '')}`;
                          } else if (icon.type === 'email') {
                            if (!settings.emailAddress) return null;
                            finalUrl = `mailto:${settings.emailAddress}`;
                          } else {
                            finalUrl = '/contact';
                          }
                        }

                        return (
                          <a 
                            key={icon.id}
                            href={finalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-500/80 text-stone-400 hover:text-white transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-inner touch-manipulation min-w-[44px] min-h-[44px]"
                            title={icon.label}
                          >
                            <SafeIconRenderer 
                              type={icon.type} 
                              useCustomIcon={icon.useCustomIcon} 
                              customIconSvg={icon.customIconSvg} 
                              className="w-4 h-4 text-stone-300"
                            />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* SECTION 2: Divider with SOCIAL media alignment */}
          {((config.socialRow.platforms && config.socialRow.platforms.some(p => p.url)) || (config.paymentBadges && config.paymentBadges.some(b => b.imageUrl))) && (
            <div className="border-t border-stone-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
              {config.socialRow.platforms && config.socialRow.platforms.filter(p => p.url).length > 0 && (
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  {config.socialRow.label && (
                    <span 
                      className={`${config.socialRow.labelFontFamily || 'font-serif'} ${config.socialRow.labelFontSize || 'text-sm'} font-bold tracking-widest uppercase`}
                      style={{ color: config.socialRow.labelColor || '#ffffff' }}
                    >
                      {config.socialRow.label}
                    </span>
                  )}
                  
                  {/* Row of platform links */}
                  <div className="flex items-center gap-3">
                    {config.socialRow.platforms.filter(p => p.url).map((platform) => (
                      <a 
                        key={platform.id}
                        href={platform.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-500/80 text-stone-400 hover:text-white transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-inner touch-manipulation min-w-[44px] min-h-[44px]"
                        title={platform.type.toUpperCase()}
                      >
                        <SafeIconRenderer 
                          type={platform.type} 
                          useCustomIcon={platform.useCustomIcon} 
                          customIconSvg={platform.customIconSvg} 
                          className="w-4 h-4 text-stone-300"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 2.2 Payment Method Badges Row */}
              {config.paymentBadges && config.paymentBadges.filter(b => b.imageUrl).length > 0 && (
                <div className="flex items-center gap-2.5 flex-wrap justify-center p-2 bg-stone-950/40 rounded border border-stone-900">
                  {config.paymentBadges.filter(b => b.imageUrl).map((badge) => (
                    <div 
                      key={badge.id}
                      className="h-7 w-12 px-1.5 py-0.5 bg-stone-900/90 rounded border border-stone-800/60 flex items-center justify-center select-none shadow-sm"
                      title={badge.name}
                    >
                      <img 
                        src={badge.imageUrl} 
                        alt={badge.name} 
                        className="max-h-full max-w-full object-contain filter brightness-90 grayscale-[20%] hover:grayscale-0 transition-all"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: Bottom Copyright bar & Legal Links */}
          {(config.copyright.text || (config.copyright.legalLinks && config.copyright.legalLinks.filter(l => l.label && l.url).length > 0)) && (
            <div className="border-t border-stone-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-stone-500 font-mono tracking-wide">
              
              {/* Real Year copyright block */}
              {config.copyright.text && (
                <div>
                  <p className="text-stone-400 text-center md:text-left leading-relaxed">
                    © {config.copyright.autoYear ? new Date().getFullYear() : config.copyright.staticYear}{' '}
                    {config.copyright.text}
                  </p>
                  <p className="text-[10px] text-stone-600 text-center md:text-left mt-0.5">
                    BIS Hallmarked Gold Jewellery • Timeless Bowbazar trust & quality certified.
                  </p>
                </div>
              )}

              {/* Legal Links layout */}
              {config.copyright.legalLinks && config.copyright.legalLinks.filter(l => l.label && l.url).length > 0 && (
                <div className="flex items-center gap-4 flex-wrap justify-center text-stone-400 font-sans font-semibold">
                  {config.copyright.legalLinks.filter(l => l.label && l.url).map((link) => (
                    <Link 
                      key={link.id} 
                      to={link.url} 
                      className="hover:text-gold-400 transition-colors py-1.5 md:py-0 min-h-[36px] md:min-h-0 flex items-center"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      </footer>
    </div>
  );
}
