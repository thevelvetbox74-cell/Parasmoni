/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Sparkles,
  ArrowRight,
  Info,
  Calendar
} from 'lucide-react';
import { getOptimizedShowroomUrl } from '../imagekit/client';

// ==========================================
// Types & Interfaces
// ==========================================

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  collection: string;
  metalType: string; // e.g., '22K Gold', '18K Diamond'
  approxWeight: string; // e.g., '24.50g'
  imageUrl: string;
  isPopular?: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  desktopImage?: string;
  mobileImage?: string;
  mediaType?: 'image' | 'video';
  desktopVideo?: string;
  mobileVideo?: string;
  titleColor?: string;
  titleFont?: string;
  subtitleColor?: string;
  subtitleFont?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

export interface MetalPrice {
  metal: string; // e.g., 'Gold (22K)', 'Gold (24K)', 'Silver'
  pricePerGram: number;
  change: number; // Percentage change e.g., +0.25
  unit: string; // e.g., '1g' or '10g'
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  slug: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: string;
  mapUrl: string;
  imageUrl: string;
}

// ==========================================
// 1. WhatsApp & Call Buttons (Pure CTA Actions)
// ==========================================

interface WhatsAppButtonProps {
  phoneNumber: string;
  message: string;
  className?: string;
  label?: string;
}

export function WhatsAppButton({ 
  phoneNumber, 
  message, 
  className = "", 
  label = "INQUIRE ON WHATSAPP" 
}: WhatsAppButtonProps): React.JSX.Element {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded px-4 py-2.5 shadow-sm cursor-pointer ${className}`}
      id={`wa-cta-${cleanPhone}`}
    >
      <MessageCircle className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </a>
  );
}

interface CallButtonProps {
  phoneNumber: string;
  className?: string;
  label?: string;
}

export function CallButton({ 
  phoneNumber, 
  className = "", 
  label = "CALL SHOWROOM" 
}: CallButtonProps): React.JSX.Element {
  return (
    <a
      href={`tel:${phoneNumber}`}
      className={`inline-flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-stone-100 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded px-4 py-2.5 border border-stone-700/50 cursor-pointer ${className}`}
      id={`call-cta-${phoneNumber.replace(/[^0-9]/g, '')}`}
    >
      <Phone className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </a>
  );
}

// ==========================================
// 2. Contact Buttons (No "Buy Now" - Contact Only)
// ==========================================

interface ContactButtonsProps {
  phoneNumber: string;
  whatsappNumber: string;
  whatsappMessage: string;
  className?: string;
}

export function ContactButtons({ 
  phoneNumber, 
  whatsappNumber, 
  whatsappMessage,
  className = "" 
}: ContactButtonsProps): React.JSX.Element {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`} id="action-contact-group">
      <WhatsAppButton 
        phoneNumber={whatsappNumber} 
        message={whatsappMessage} 
        className="w-full"
      />
      <CallButton 
        phoneNumber={phoneNumber} 
        className="w-full"
      />
    </div>
  );
}

// ==========================================
// 3. Product Card & Product Grid
// ==========================================

interface ProductCardProps {
  key?: string | number;
  product: Product;
  whatsappNumber: string;
  whatsappTemplate?: string;
}

export function ProductCard({ 
  product, 
  whatsappNumber,
  whatsappTemplate = "Hello Parasmoni Jewellers, I am highly interested in the following masterpiece:\n\n*Name*: {NAME}\n*SKU*: {SKU}\n*Weight*: {WEIGHT}\n\nPlease share design details and pricing."
}: ProductCardProps): React.JSX.Element {
  const optimizedUrl = getOptimizedShowroomUrl(product.imageUrl, { width: 500, height: 500 });
  
  const customMessage = whatsappTemplate
    .replace("{NAME}", product.name)
    .replace("{SKU}", product.sku)
    .replace("{WEIGHT}", product.approxWeight);

  return (
    <div 
      className="bg-white rounded border border-stone-200 overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300 relative h-full"
      id={`product-card-${product.id}`}
    >
      {/* Visual Accent/Badge */}
      {product.isPopular && (
        <span className="absolute top-3 left-3 z-10 bg-brand-red-600 text-stone-100 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-gold-300" />
          <span>SIGNATURE</span>
        </span>
      )}

      {/* Image Block */}
      <div className="relative aspect-square overflow-hidden bg-stone-50 border-b border-stone-100">
        {optimizedUrl && (optimizedUrl.toLowerCase().split('?')[0].endsWith('.mp4') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.mov') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.webm') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.m4v')) ? (
          <video 
            src={optimizedUrl} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play().catch(() => {});
            }}
          />
        ) : (
          <img 
            src={optimizedUrl || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600"} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-stone-900/5 group-hover:bg-stone-900/0 transition-colors" />
      </div>

      {/* Attributes Block */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[10px] text-stone-500 font-semibold tracking-wider uppercase">
              {product.category}
            </span>
            <span className="text-[10px] bg-gold-500/10 text-gold-800 px-1.5 py-0.5 rounded font-medium">
              {product.metalType}
            </span>
          </div>

          <h3 className="font-serif font-semibold text-stone-800 text-sm tracking-wide leading-tight group-hover:text-brand-red-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-4 text-xs font-medium text-stone-500 py-1 border-y border-stone-100">
            <div>
              <span className="text-[10px] block text-stone-400">SKU</span>
              <span className="font-mono text-stone-700">{product.sku}</span>
            </div>
            <div>
              <span className="text-[10px] block text-stone-400">Approx. Weight</span>
              <span className="font-semibold text-stone-700">{product.approxWeight}</span>
            </div>
          </div>
        </div>

        {/* Action CTAs (Showroom Rule: Direct inquiry only, NO purchase/checkout) */}
        <div className="mt-4 pt-1 space-y-2">
          <WhatsAppButton 
            phoneNumber={whatsappNumber}
            message={customMessage}
            className="w-full py-2 text-[10px] font-bold"
            label="Inquire Price & Stock"
          />
          <Link 
            to={`/product/${product.id}`}
            className="w-full block text-center border border-stone-300 text-stone-700 hover:bg-stone-50 text-[10px] font-bold tracking-widest uppercase transition-colors rounded py-2"
          >
            View Masterpiece
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ProductGridProps {
  products: Product[];
  whatsappNumber: string;
  emptyMessage?: string;
}

export function ProductGrid({ 
  products, 
  whatsappNumber,
  emptyMessage = "No signature masterpieces match your query. Contact our master artisan for customized designs."
}: ProductGridProps): React.JSX.Element {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 px-6 border border-dashed border-stone-300 rounded bg-stone-50 max-w-xl mx-auto" id="empty-products-view">
        <Info className="w-8 h-8 text-stone-400 mx-auto mb-3" />
        <p className="text-stone-600 text-sm font-serif italic">{emptyMessage}</p>
        <Link 
          to="/contact" 
          className="mt-4 inline-flex h-9 px-5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-[10px] font-semibold tracking-widest uppercase rounded items-center gap-2"
        >
          <span>Request Custom Design</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="showroom-products-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} whatsappNumber={whatsappNumber} />
      ))}
    </div>
  );
}

// ==========================================
// 4. Premium Banner Slider
// ==========================================

interface BannerSliderProps {
  banners: Banner[];
}

export function BannerSlider({ banners }: BannerSliderProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  
  const startXRef = useRef(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive break observer
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasMultiple = banners.length > 1;

  // Build the seamless cloned array of banners to allow sliding infinitely both left and right
  const clonedBanners = hasMultiple 
    ? [...banners.slice(-2), ...banners, ...banners.slice(0, 2)] 
    : banners;

  // The virtual center-mapped index used for rendering and position math
  const virtualIndex = hasMultiple ? currentIndex + 2 : currentIndex;

  // Normalizes any out-of-bound indexes to map correctly to original dot indicators (0 to N-1)
  const displayActiveIndex = hasMultiple 
    ? ((currentIndex % banners.length) + banners.length) % banners.length 
    : 0;

  // Timer-driven auto-advance with dynamic pausing under drag/hover
  useEffect(() => {
    if (banners.length <= 1 || isDragging) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 3500); // 3.5s smooth autoplay rotation

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [banners, isDragging]);

  // Hook to instantly handle infinite loop resetting silently behind the scenes
  useEffect(() => {
    if (!transitionEnabled) {
      const timer = setTimeout(() => {
        setTransitionEnabled(true);
      }, 30); // Instant frame transition resetting
      return () => clearTimeout(timer);
    }
  }, [transitionEnabled]);

  if (banners.length === 0) return <div className="h-[400px] bg-stone-950" />;

  const handlePrev = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => prev + 1);
  };

  // Instant seamless snap resetting on transition completion
  const handleTransitionEnd = () => {
    if (!hasMultiple) return;
    if (currentIndex >= banners.length) {
      setTransitionEnabled(false);
      setCurrentIndex(0);
    } else if (currentIndex < 0) {
      setTransitionEnabled(false);
      setCurrentIndex(banners.length - 1);
    }
  };

  // Drag Gesture Handlers (Touch + Mouse dragging)
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    setDragOffset(0);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - startXRef.current;
    // Apply minor friction so swipe moves in absolute synchronization
    setDragOffset(delta);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // If drag exceeds threshold of 70px, advance or reverse slides
    if (dragOffset > 70) {
      handlePrev();
    } else if (dragOffset < -70) {
      handleNext();
    }
    setDragOffset(0);
  };

  // Get properly transformed, optimized ImageKit responsive URLs
  const getBannerImage = (banner: Banner) => {
    const rawImage = (isMobile && banner.mobileImage) ? banner.mobileImage : (banner.desktopImage || banner.image);
    const targetWidth = isMobile ? 800 : 1600;
    return getOptimizedShowroomUrl(rawImage, { width: targetWidth, quality: 85 }) || rawImage;
  };

  // Math-guided Peek Carousel Track translates (percentage based)
  const slideWidth = isMobile ? 85 : 75; // 85% width on mobile, 75% on desktop
  const centerOffset = (100 - slideWidth) / 2; // Centers the active slide exactly
  const trackTranslate = centerOffset - (virtualIndex * slideWidth);

  return (
    <div 
      className="relative w-full overflow-hidden bg-white pt-0 pb-6 md:pb-12 border-b border-stone-100 select-none" 
      id="showroom-banner-slider"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => {
        setIsInteracting(false);
        handleDragEnd();
      }}
    >
      {/* Horizontal Slider Track Container */}
      <div 
        className={`flex w-full ${isDragging || !transitionEnabled ? 'transition-none' : 'transition-transform duration-700'}`}
        style={{ 
          transform: `translate3d(calc(${trackTranslate}% + ${dragOffset}px), 0px, 0px)`,
          transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
        }}
        onTransitionEnd={handleTransitionEnd}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => {
          if (e.touches && e.touches[0]) {
            handleDragStart(e.touches[0].clientX);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches && e.touches[0]) {
            handleDragMove(e.touches[0].clientX);
          }
        }}
        onTouchEnd={handleDragEnd}
      >
        {clonedBanners.map((banner, index) => {
          const isActive = index === virtualIndex;
          const displayImage = getBannerImage(banner);
          
          // Check if video file should be rendered (with auto-detection support)
          const isUrlVideo = (url?: string) => {
            if (!url) return false;
            const lower = url.toLowerCase();
            return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.m4v');
          };

          const isDirectVideo = isUrlVideo(banner.image) || isUrlVideo(banner.desktopImage) || isUrlVideo(banner.mobileImage);
          const activeVideoUrl = (isMobile ? (banner.mobileVideo || banner.desktopVideo) : banner.desktopVideo) || 
                                (isDirectVideo ? ((isMobile && banner.mobileImage) ? banner.mobileImage : (banner.desktopImage || banner.image)) : '');
          const hasVideo = banner.mediaType === 'video' || isDirectVideo || isUrlVideo(activeVideoUrl);

          return (
            <div
              key={`${banner.id}-clone-${index}`}
              onClick={() => {
                if (!isActive) {
                  // Click advances the relative distance to keep movement in same direction
                  setCurrentIndex((prev) => prev + (index - virtualIndex));
                }
              }}
              className={`flex-shrink-0 h-[460px] md:h-[650px] relative px-1.5 md:px-3.5 transition-all duration-700 ease-out select-none ${
                isActive 
                  ? 'scale-100 z-10 opacity-100' 
                  : 'scale-95 z-0 opacity-40 brightness-50 hover:opacity-60 hover:brightness-75 cursor-pointer'
              }`}
              style={{ width: `${slideWidth}%` }}
              id={`slide-card-${banner.id}-${index}`}
            >
              {/* Nested rounded container matching luxury brand guidelines */}
              <div className="w-full h-full relative rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-stone-200/60 bg-stone-950">
                {/* Media Layer (Video or Image) */}
                {hasVideo ? (
                  <video
                    src={getOptimizedShowroomUrl(activeVideoUrl) || activeVideoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onEnded={(e) => {
                      e.currentTarget.currentTime = 0;
                      e.currentTarget.play().catch(() => {});
                    }}
                    draggable={false}
                  />
                ) : (
                  <img
                    src={displayImage}
                    alt={banner.title}
                    className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${
                      isActive ? 'scale-102' : 'scale-100'
                    }`}
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                )}
                
                {/* Visual shading layers (kept transparent for maximum jewelry sparkle/vibrancy) */}
                <div className="absolute inset-0 bg-transparent" />
                
                {/* Readable Text Overlay - Only rendered on the central active card if text content exists */}
                {isActive && (banner.title?.trim() || banner.subtitle?.trim() || banner.buttonText?.trim()) && (
                  <div 
                    className="absolute inset-0 flex items-end md:items-center px-8 md:px-24 pb-16 md:pb-0 bg-transparent transition-opacity duration-500"
                  >
                    <div className="max-w-xl md:max-w-2xl space-y-4 md:space-y-6 text-left select-text">
                      {banner.title?.trim() && (
                        <h2 
                          className={`text-3xl md:text-5xl lg:text-6xl font-normal tracking-wide leading-[1.15] drop-shadow-lg`}
                          style={{
                            fontFamily: banner.titleFont === 'sans' ? "'Inter', 'Plus Jakarta Sans', sans-serif" : "'Playfair Display', Georgia, serif",
                            color: banner.titleColor || '#ffffff'
                          }}
                        >
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle?.trim() && (
                        <p 
                          className={`text-sm md:text-lg lg:text-xl tracking-wide opacity-95 font-normal drop-shadow-md`}
                          style={{
                            fontFamily: banner.subtitleFont === 'serif' ? "'Playfair Display', Georgia, serif" : "'Inter', 'Plus Jakarta Sans', sans-serif",
                            color: banner.subtitleColor || '#f5f5f4'
                          }}
                        >
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.buttonText?.trim() && (
                        <div className="pt-2 md:pt-4">
                          <Link
                            to={banner.buttonLink || '/catalog'}
                            className="inline-flex h-11 md:h-12 px-6 md:px-8 text-xs md:text-sm font-semibold tracking-wide rounded-md items-center justify-center cursor-pointer shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              backgroundColor: banner.buttonColor || '#ffffff',
                              color: banner.buttonTextColor || '#991b1b'
                            }}
                          >
                            <span>{banner.buttonText}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                index === displayActiveIndex ? 'bg-brand-red-600 w-5 md:w-6' : 'bg-stone-400/40 hover:bg-stone-600/60 w-1.5 md:w-2'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. Metal Price Announcement Bar & Price Card
// ==========================================

interface MetalPriceBarProps {
  prices: MetalPrice[];
}

export function MetalPriceBar({ prices }: MetalPriceBarProps): React.JSX.Element {
  const duplicatedPrices = prices && prices.length > 0 ? [...prices, ...prices, ...prices] : [];

  return (
    <div 
      className="bg-stone-950 text-stone-200 py-2 border-b border-gold-500/10 text-xs tracking-wider overflow-hidden relative select-none w-full" 
      id="metal-announcement-bar" 
      style={{ fontFamily: "'Arial Narrow', 'Arial', sans-serif" }}
    >
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.3333%, 0, 0); }
        }
        .ticker-container-animate {
          display: flex;
          width: max-content;
          animation: ticker-scroll 35s linear infinite;
        }
        .ticker-container-animate:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="flex items-center w-full">
        {duplicatedPrices.length > 0 ? (
          <div className="ticker-container-animate">
            {duplicatedPrices.map((p, idx) => {
              const isUp = p.change >= 0;
              return (
                <div key={idx} className="flex items-center gap-2 px-6 border-r border-stone-900 shrink-0 whitespace-nowrap">
                  <span className="text-stone-300 font-bold uppercase whitespace-nowrap">{p.metal}</span>
                  <span className="text-gold-400 font-mono font-bold whitespace-nowrap">₹{p.pricePerGram.toLocaleString('en-IN')}/{p.unit}</span>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1 rounded whitespace-nowrap ${
                    isUp ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    <span>{isUp ? '▲' : '▼'}</span>
                    <span>{isUp ? '+' : ''}{p.change}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pl-4 text-stone-500 text-[10px] font-semibold uppercase tracking-wider">
            Connecting to Live Bullion Stream...
          </div>
        )}
      </div>
    </div>
  );
}

interface MetalPriceCardProps {
  key?: string | number;
  price: MetalPrice;
}

export function MetalPriceCard({ price }: MetalPriceCardProps): React.JSX.Element {
  const isUp = price.change >= 0;

  return (
    <div 
      className="bg-white rounded border border-stone-200 p-5 flex flex-col justify-between hover:shadow-xs transition-shadow relative overflow-hidden"
      id={`metal-card-${price.metal.replace(/\s+/g, '')}`}
    >
      <div className="absolute right-0 top-0 w-24 h-24 bg-gold-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />

      <div className="space-y-1.5 relative">
        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold block">
          Showroom Rate
        </span>
        <h4 className="font-serif font-bold text-stone-800 text-lg">
          {price.metal}
        </h4>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-baseline justify-between gap-2">
        <div>
          <span className="text-[10px] text-stone-400 block">Rate per {price.unit}</span>
          <span className="font-mono text-2xl font-bold text-brand-red-950">
            ₹{price.pricePerGram.toLocaleString('en-IN')}
          </span>
        </div>

        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
          isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}>
          <TrendingUp className={`w-3 h-3 ${!isUp && 'rotate-180'}`} />
          <span>{isUp ? '+' : ''}{price.change}%</span>
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 6. Collection Card & Store Card
// ==========================================

interface CollectionCardProps {
  key?: string | number;
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps): React.JSX.Element {
  const optimizedUrl = getOptimizedShowroomUrl(collection.imageUrl, { width: 400, height: 400 });

  return (
    <Link 
      to={`/collections?type=${collection.slug}`}
      className="group block relative aspect-square bg-stone-900 rounded overflow-hidden border border-stone-200"
      id={`collection-card-${collection.id}`}
    >
      {optimizedUrl && (optimizedUrl.toLowerCase().split('?')[0].endsWith('.mp4') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.mov') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.webm') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.m4v')) ? (
        <video 
          src={optimizedUrl} 
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105 opacity-80"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onEnded={(e) => {
            e.currentTarget.currentTime = 0;
            e.currentTarget.play().catch(() => {});
          }}
        />
      ) : (
        <img 
          src={optimizedUrl || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600"} 
          alt={collection.name}
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105 opacity-80"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/10 to-transparent" />
      
      {/* Content overlays */}
      <div className="absolute inset-x-0 bottom-0 p-5 space-y-1">
        <span className="text-[9px] text-gold-400 font-bold tracking-widest uppercase">
          EXPLORE CATALOGUE
        </span>
        <h4 className="font-serif font-bold text-stone-100 text-base md:text-lg tracking-wide group-hover:text-gold-300 transition-colors">
          {collection.name}
        </h4>
        <p className="text-stone-300 text-[11px] leading-relaxed line-clamp-2 max-w-sm">
          {collection.description}
        </p>
      </div>
    </Link>
  );
}

interface StoreCardProps {
  key?: string | number;
  store: StoreLocation;
}

export function StoreCard({ store }: StoreCardProps): React.JSX.Element {
  const optimizedUrl = getOptimizedShowroomUrl(store.imageUrl, { width: 500, height: 350 });

  return (
    <div 
      className="bg-white rounded border border-stone-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow duration-300"
      id={`store-card-${store.id}`}
    >
      {/* Photo Column */}
      <div className="md:w-2/5 aspect-video md:aspect-auto relative bg-stone-50 border-b md:border-b-0 md:border-r border-stone-100">
        {optimizedUrl && (optimizedUrl.toLowerCase().split('?')[0].endsWith('.mp4') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.mov') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.webm') || optimizedUrl.toLowerCase().split('?')[0].endsWith('.m4v')) ? (
          <video 
            src={optimizedUrl} 
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play().catch(() => {});
            }}
          />
        ) : (
          <img 
            src={optimizedUrl || "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=600"} 
            alt={store.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Copy Column */}
      <div className="p-6 md:w-3/5 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block mb-1">
              PHYSICAL SHOWROOM
            </span>
            <h4 className="font-serif font-bold text-stone-900 text-lg leading-tight">
              {store.name}
            </h4>
          </div>

          <div className="space-y-2.5 text-xs text-stone-600">
            <div className="flex gap-2.5">
              <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{store.address}</span>
            </div>
            <div className="flex gap-2.5 items-center">
              <Clock className="w-4 h-4 text-gold-500 shrink-0" />
              <span>{store.hours}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-wrap gap-3">
          <WhatsAppButton 
            phoneNumber={store.whatsapp}
            message={`Hello Parasmoni Jewellers, I would like to schedule a showroom visit/consultation at your ${store.name} branch.`}
            className="flex-1 py-2 text-[10px]"
            label="Book Appointment"
          />
          <a
            href={store.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-stone-300 text-stone-700 hover:bg-stone-50 text-[10px] font-bold tracking-widest uppercase transition-colors rounded px-4 py-2 flex items-center justify-center gap-1"
          >
            <span>Google Maps</span>
            <ArrowRight className="w-3 h-3 text-stone-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
