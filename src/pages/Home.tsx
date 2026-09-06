/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Award, 
  History, 
  Scale, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  Tags,
  RefreshCw,
  AlertCircle,
  Database,
  GripVertical,
  Plus,
  X,
  MessageCircle,
  Gem,
  Crown,
  Check,
  Star,
  User,
  Quote,
  Truck,
  RotateCcw,
  Lock,
  Shield,
  Headphones,
  ArrowRight,
  FileText
} from 'lucide-react';
import { 
  BannerSlider, 
  MetalPriceCard, 
  CollectionCard, 
  ProductGrid, 
  ProductHorizontalCarousel,
  StoreCard, 
  ContactButtons,
  WhatsAppButton
} from '../components/ShowroomComponents';
import { getOptimizedShowroomUrl } from '../imagekit/client';
import { 
  mockBanners, 
  mockMetalPrices, 
  mockCollections, 
  mockProducts, 
  mockStores 
} from '../data/mockData';
import { mockWebsiteSettings } from '../data/mockSettings';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { PageSEOHead } from '../components/PageSEOHead';
import { SectionHeader } from '../components/SectionHeader';
import { db, isFirebaseConfigured } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  doc,
  setDoc
} from 'firebase/firestore';

const DEFAULT_CATEGORIES_MOCK = [
  {
    id: 'cat-necklaces',
    name: 'Necklaces',
    slug: 'necklaces',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
    displayOrder: 1,
    status: 'active'
  },
  {
    id: 'cat-earrings',
    name: 'Earrings',
    slug: 'earrings',
    imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=600',
    displayOrder: 2,
    status: 'active'
  },
  {
    id: 'cat-rings',
    name: 'Rings',
    slug: 'rings',
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
    displayOrder: 3,
    status: 'active'
  },
  {
    id: 'cat-bangles',
    name: 'Bangles',
    slug: 'bangles',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600',
    displayOrder: 4,
    status: 'active'
  },
  {
    id: 'cat-bracelets',
    name: 'Bracelets',
    slug: 'bracelets',
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600',
    displayOrder: 5,
    status: 'active'
  },
  {
    id: 'cat-mangalsutra',
    name: 'Mangalsutra',
    slug: 'mangalsutra',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
    displayOrder: 6,
    status: 'active'
  }
];

const defaultMockTestimonials = [
  {
    id: 'mock-test-1',
    reviewerName: 'Ananya Sharma',
    reviewerLocation: 'Bengaluru',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    rating: 5,
    reviewText: '"The packaging of Parasmoni is genuinely breathtaking! The Royal Mayura bangle arrived with the BIS hallmark certificate. Shines even brighter than my gold jewelry."',
    verifiedBadge: true,
    linkedProductId: 'p1',
    displayOrder: 1,
    status: 'active',
    type: 'review'
  },
  {
    id: 'mock-photo-1',
    type: 'photo',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
    reviewText: 'Wearing our hand-carved heritage choker set from Parasmoni at the reception. Unmatched elegance!',
    displayOrder: 2,
    status: 'active'
  },
  {
    id: 'mock-test-2',
    reviewerName: 'Rajesh Mukherjee',
    reviewerLocation: 'Kolkata',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    rating: 5,
    reviewText: '"Excellent craftsmanship and perfect transparency. Visited their Bowbazar showroom for my daughter\'s wedding set. Recommended for traditional gold wirework and filigree masterpieces."',
    verifiedBadge: true,
    linkedProductId: 'p2',
    displayOrder: 3,
    status: 'active',
    type: 'review'
  },
  {
    id: 'mock-photo-2',
    type: 'photo',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=600',
    reviewText: 'Classic 22k filigree ring detail from our wedding trousseau.',
    displayOrder: 4,
    status: 'active'
  },
  {
    id: 'mock-test-3',
    reviewerName: 'Priya Sen',
    reviewerLocation: 'Mumbai',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    rating: 5,
    reviewText: '"Parasmoni has been our family jeweller for three generations. Their design uniqueness and the weight transparency are what keep us coming back every Dhanteras."',
    verifiedBadge: true,
    displayOrder: 5,
    status: 'active',
    type: 'review'
  },
  {
    id: 'mock-photo-3',
    type: 'photo',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600',
    reviewText: 'Stunning Nakashi antique earrings from Parasmoni. Captured under the showroom lights!',
    displayOrder: 6,
    status: 'active'
  }
];

// --- Error Handling & Metrics conforme to fire-integration instructions ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured:', JSON.stringify(errInfo));
}

export interface HomeProps {
  pageId?: string;
  isBuilder?: boolean;
  sectionsOverride?: any[];
  pageSections?: any[];
  loadingSections?: boolean;
  onAddSectionClick?: (index: number) => void;
  onDeleteSectionClick?: (index: number) => void;
  onReorderSections?: (newSections: any[]) => void;
  onSectionClick?: (id: string) => void;
  selectedSectionId?: string;
  seoData?: any;
}

const getFontFamilyName = (family: string | undefined, defaultFamily: 'serif' | 'sans') => {
  if (!family) {
    return defaultFamily === 'serif' 
      ? "'Playfair Display', Georgia, serif" 
      : "'Inter', 'Plus Jakarta Sans', sans-serif";
  }
  switch (family.toLowerCase()) {
    case 'serif':
      return "'Playfair Display', Georgia, serif";
    case 'cinzel':
      return "'Cinzel', 'Playfair Display', Georgia, serif";
    case 'cormorant':
      return "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
    case 'marcellus':
      return "'Marcellus', 'Playfair Display', Georgia, serif";
    case 'sans':
      return "'Inter', 'Plus Jakarta Sans', sans-serif";
    case 'poppins':
      return "'Poppins', 'Inter', sans-serif";
    case 'montserrat':
      return "'Montserrat', 'Inter', sans-serif";
    case 'lora':
      return "'Lora', 'Playfair Display', Georgia, serif";
    case 'prata':
      return "'Prata', 'Playfair Display', Georgia, serif";
    case 'cursive':
      return "'Sacramento', 'Dancing Script', cursive";
    case 'mono':
      return "'Courier Prime', 'Courier New', monospace";
    case 'lobster':
      return "'Lobster', cursive";
    case 'alex-brush':
      return "'Alex Brush', 'Dancing Script', cursive";
    default:
      return defaultFamily === 'serif' 
        ? "'Playfair Display', Georgia, serif" 
        : "'Inter', 'Plus Jakarta Sans', sans-serif";
  }
};

const getTextStyleLocal = (styles: any, defaultColor: string, defaultFontFamily: 'serif' | 'sans') => {
  const fontFamilyString = getFontFamilyName(styles?.fontFamily, defaultFontFamily);
  const familyStyle = { fontFamily: fontFamilyString };

  let fontSizeStyle = undefined;
  if (styles?.fontSize) {
    const rawSize = typeof styles.fontSize === 'number' ? `${styles.fontSize}px` : styles.fontSize;
    const numericSize = parseFloat(rawSize);
    if (!isNaN(numericSize)) {
      // Use premium fluid typography clamp to scale custom text size proportionally on mobile
      const minSize = defaultFontFamily === 'serif' ? Math.max(13, Math.round(numericSize * 0.45)) : Math.max(9, Math.round(numericSize * 0.65));
      fontSizeStyle = `clamp(${minSize}px, ${(numericSize / 12).toFixed(2)}vw, ${numericSize}px)`;
    } else {
      fontSizeStyle = rawSize;
    }
  }

  return {
    color: styles?.color || defaultColor,
    fontSize: fontSizeStyle,
    ...familyStyle
  };
};

const getButtonStyleLocal = (btn: any, defaultStyleType: 'filled' | 'outlined') => {
  if (!btn) return undefined;
  const styleType = btn.styleType || defaultStyleType;
  const styleObj: any = {};
  if (btn.bgColor) {
    if (styleType === 'filled') {
      styleObj.backgroundColor = btn.bgColor;
    } else {
      styleObj.borderColor = btn.bgColor;
      styleObj.color = btn.bgColor;
    }
  }
  if (btn.textColor && styleType === 'filled') {
    styleObj.color = btn.textColor;
  }
  return styleObj;
};

const AboutCollectionSection = ({ content = {} }: { content: any }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const title = content.title !== undefined && content.title !== null ? content.title : 'Crafting Elegance for Five Decades';
  const subtitle = content.subtitle !== undefined && content.subtitle !== null ? content.subtitle : 'BOWBAZAR TRADITION';
  const quoteText = content.quoteText !== undefined && content.quoteText !== null ? content.quoteText : '"For over 50 years, Parasmoni Jewellers & Brothers has remained a sanctuary for families seeking authentic gold wirework, certified solitaires, and antique nakashi designs."';
  const description = content.description !== undefined && content.description !== null ? content.description : 'Founded on the pillars of transparency and meticulous artisan work in Kolkata\'s historic Bowbazar, we maintain a legacy where every piece represents physical sovereign value and unparalleled visual poetry.';
  
  const rawTitleStyle = getTextStyleLocal(content.titleStyle, '#f5f5f4', 'serif');
  const rawSubtitleStyle = getTextStyleLocal(content.subtitleStyle, '#fbbf24', 'sans');
  const rawDescStyle = getTextStyleLocal(content.descriptionStyle, '#a8a29e', 'sans');
  const rawQuoteStyle = getTextStyleLocal(content.quoteStyle, '#a8a29e', 'serif');
  const rawBulletTextStyle = getTextStyleLocal(content.bulletStyle, '#a8a29e', 'sans');

  // Strip hardcoded inline font-sizes on mobile to let beautiful, responsive tailwind text-size classes drive the wrapping and proportions
  const titleStyle = isMobile ? { ...rawTitleStyle, fontSize: undefined } : rawTitleStyle;
  const subtitleStyle = isMobile ? { ...rawSubtitleStyle, fontSize: undefined } : rawSubtitleStyle;
  const descStyle = isMobile ? { ...rawDescStyle, fontSize: undefined } : rawDescStyle;
  const quoteStyle = isMobile ? { ...rawQuoteStyle, fontSize: undefined } : rawQuoteStyle;
  const bulletTextStyle = isMobile ? { ...rawBulletTextStyle, fontSize: undefined } : rawBulletTextStyle;

  const badgeBg = content.subtitleStyle?.bgColor || '#1c1917';
  const badgeBorder = content.subtitleStyle?.borderColor || 'rgba(181, 139, 55, 0.3)';
  const archBorderColor = content.archBorderColor || '#b58b37';

  const image1 = content.mediaUrl || content.image1 || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600";
  const image2 = content.mediaUrl2 || content.image2 || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=300";

  const bullets = content.bullets || [];
  const bulletIconColor = content.bulletStyle?.iconColor || '#d4af37';
  const bulletIconName = content.bulletStyle?.iconName || 'sparkle';

  const BulletIcon = (() => {
    switch (bulletIconName.toLowerCase()) {
      case 'check': return Check;
      case 'gem': return Gem;
      case 'chevron': return ChevronRight;
      case 'circle': return Clock;
      default: return Sparkles;
    }
  })();

  const SubtitleIcon = (() => {
    const iconName = content.subtitleStyle?.icon || 'History';
    switch (iconName.toLowerCase()) {
      case 'sparkles': return Sparkles;
      case 'gem': return Gem;
      case 'crown': return Crown;
      case 'award': return Award;
      default: return History;
    }
  })();

  const primaryBtn = content.primaryButton || { label: 'OUR FULL HERITAGE', linkUrl: '/about', styleType: 'filled' };
  const secondaryBtn = content.secondaryButton || { label: '', linkUrl: '', styleType: 'outlined' };

  return (
    <section 
      className="py-8 md:py-16 text-stone-200 relative overflow-hidden transition-colors duration-500 flex items-center justify-center min-h-[340px] md:min-h-[580px]" 
      id="about-collection-section"
      style={{ backgroundColor: content.backgroundColor || '#1c0507' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(var(--arch-border-color)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" style={{ '--arch-border-color': archBorderColor } as React.CSSProperties}></div>
      
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 xl:px-12 flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12 relative z-10">
        
        {/* TEXT COLUMN - Balanced width stacked on mobile, exactly 46% width on desktop */}
        <div className="w-full md:w-[46%] min-w-0 flex flex-col justify-center space-y-4 md:space-y-6 break-words overflow-hidden text-left">
          <div className="space-y-2 md:space-y-3">
            {subtitle && (
              <span 
                className="inline-flex items-center gap-1.5 font-bold tracking-widest uppercase border px-2.5 py-1 sm:px-3 sm:py-1 rounded w-fit text-[9px] sm:text-xs"
                style={{ 
                  ...subtitleStyle, 
                  backgroundColor: badgeBg, 
                  borderColor: badgeBorder 
                }}
              >
                <SubtitleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold-400" style={{ color: subtitleStyle.color }} />
                <span>{subtitle}</span>
              </span>
            )}
            {title && (
              <h2 
                className="font-serif font-bold tracking-wide leading-tight text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl break-words" 
                style={titleStyle}
              >
                {title}
              </h2>
            )}
          </div>
          
          {quoteText && (
            <p 
              className="text-stone-400 font-serif italic text-xs sm:text-sm md:text-sm lg:text-base leading-relaxed break-words" 
              style={quoteStyle}
            >
              {quoteText}
            </p>
          )}
          
          {description && (
            <p 
              className="font-sans leading-relaxed text-stone-300 text-xs sm:text-sm md:text-xs lg:text-sm break-words" 
              style={descStyle}
            >
              {description}
            </p>
          )}

          {bullets.length > 0 && (
            <ul className="space-y-2 pt-1">
              {bullets.map((bullet: any, idx: number) => (
                <li key={bullet.id || idx} className="flex items-start gap-2">
                  <BulletIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: bulletIconColor }} />
                  <span className="text-xs sm:text-sm md:text-xs lg:text-sm break-words" style={bulletTextStyle}>{bullet.text}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2 sm:pt-4 flex flex-wrap gap-2.5 md:gap-4 relative z-30 pointer-events-auto">
            {primaryBtn.label && (
              <Link 
                to={primaryBtn.linkUrl || '/about'}
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 font-semibold tracking-widest uppercase transition-all duration-300 rounded cursor-pointer z-30 
                  h-10 px-4 text-[10px] sm:h-11 sm:px-5 sm:text-xs md:h-11 md:px-6 whitespace-nowrap ${
                  primaryBtn.styleType === 'outlined' 
                    ? 'border border-gold-500/40 hover:bg-gold-500/10 text-gold-400' 
                    : 'bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 shadow-lg'
                }`}
                style={getButtonStyleLocal(primaryBtn, 'filled')}
              >
                <span>{primaryBtn.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
            {secondaryBtn.label && (
              <Link 
                to={secondaryBtn.linkUrl || '/contact'}
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 font-semibold tracking-widest uppercase transition-all duration-300 rounded cursor-pointer z-30 
                  h-10 px-4 text-[10px] sm:h-11 sm:px-5 sm:text-xs md:h-11 md:px-6 whitespace-nowrap ${
                  secondaryBtn.styleType === 'filled' 
                    ? 'bg-brand-red-600 hover:bg-brand-red-700 text-stone-100 shadow-lg' 
                    : 'border border-stone-750 hover:bg-stone-900 text-stone-300'
                }`}
                style={getButtonStyleLocal(secondaryBtn, 'outlined')}
              >
                <span>{secondaryBtn.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* IMAGE COLUMN - Centered with standard gutters and healthy margins to prevent screen edge overflow */}
        <div className="w-[75%] sm:w-[65%] md:w-[48%] max-w-[440px] min-w-0 flex justify-center items-center relative px-4 sm:px-6 md:px-8 py-4 md:py-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-72 md:h-72 bg-gold-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          {/* Main Tall Arch Image - Proportional Percentage Sized */}
          <div 
            className="relative w-[70%] aspect-[3/4.2] rounded-t-full border p-0.5 md:p-1 bg-stone-900/50 shadow-2xl overflow-visible group"
            style={{ borderColor: archBorderColor }}
          >
            <div className="w-full h-full rounded-t-full overflow-hidden relative">
              <img 
                src={getOptimizedShowroomUrl(image1) || image1} 
                alt="About Collection Main" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Overlapping Small Arch Image (Bottom-Left) */}
            <div 
              className="absolute bottom-[-1%] left-[-10%] sm:left-[-22%] w-[50%] aspect-[3/4] rounded-t-full border p-0.5 bg-stone-900/95 shadow-2xl z-20 hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-out group/sub"
              style={{ borderColor: archBorderColor }}
            >
              <div className="w-full h-full rounded-t-full overflow-hidden relative">
                <img 
                  src={getOptimizedShowroomUrl(image2) || image2} 
                  alt="About Collection Sub" 
                  className="w-full h-full object-cover group-hover/sub:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

interface OfferBannerB1Props {
  content?: any;
}

export const OfferBannerB1: React.FC<OfferBannerB1Props> = (props) => {
  const content = props.content || {};
  const tiles = Array.isArray(content.tiles) ? content.tiles : [];
  const badges = Array.isArray(content.badges) ? content.badges : [];

  // State for mobile auto-advancing carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (tiles.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % tiles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tiles.length, isHovered]);

  // Helper to render individual badge icon
  const renderBadgeIcon = (badge: any) => {
    if (badge.useCustomIcon && badge.customIconSvg) {
      return (
        <span 
          className="flex items-center justify-center w-8 h-8 shrink-0 text-amber-600 font-normal [&>svg]:w-6 [&>svg]:h-6"
          dangerouslySetInnerHTML={{ __html: badge.customIconSvg }}
        />
      );
    }

    const iconProps = { className: "w-6 h-6 text-amber-600 shrink-0" };
    switch (badge.icon) {
      case 'truck':
        return <Truck {...iconProps} />;
      case 'rotate-ccw':
        return <RotateCcw {...iconProps} />;
      case 'lock':
        return <Lock {...iconProps} />;
      case 'shield':
        return <Shield {...iconProps} />;
      case 'award':
        return <Award {...iconProps} />;
      case 'headphones':
        return <Headphones {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'check':
        return <Check {...iconProps} />;
      default:
        return <Sparkles {...iconProps} />;
    }
  };

  // Helper to get heading font class
  const getHeadingFontClass = (font: string) => {
    if (font === 'serif') return 'font-serif tracking-wide';
    if (font === 'cinzel') return 'font-serif tracking-wider uppercase';
    return 'font-sans tracking-tight';
  };

  // Helper to get heading size class
  const getHeadingSizeClass = (size: string) => {
    switch (size) {
      case 'text-sm': return 'text-sm';
      case 'text-base': return 'text-sm md:text-base';
      case 'text-lg': return 'text-base md:text-lg';
      case 'text-xl': return 'text-lg md:text-xl';
      case 'text-2xl': return 'text-xl md:text-2xl';
      default: return 'text-lg';
    }
  };

  return (
    <section className="py-12 bg-white flex flex-col gap-10 animate-fade-in" id="offer-banner-b1-section">
      {/* TOP ROW: THREE BANNER TILES */}
      {tiles.length > 0 && (
        <div className="w-full px-4 md:px-8 xl:px-12">
          {/* Desktop Layout: Side-by-side tiles */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiles.map((tile: any, idx: number) => {
              const bgImage = tile.desktopImage || tile.mobileImage;
              const overlayBg = tile.overlayColor || 'transparent';
              const eyebrowFont = tile.eyebrowFont === 'serif' ? 'font-serif' : tile.eyebrowFont === 'cinzel' ? 'font-serif uppercase tracking-wider' : 'font-sans';
              const headingFont = getHeadingFontClass(tile.headingFont);
              const headingSize = getHeadingSizeClass(tile.headingSize);
              const isCover = tile.imagePosition === 'cover';

              // Ensure the arrow -> is appended cleanly
              const rawLabel = tile.buttonLabel || '';
              const displayLabel = rawLabel.endsWith('→') || rawLabel.endsWith('➔') ? rawLabel : `${rawLabel} →`;

              const hasEyebrow = tile.eyebrow && String(tile.eyebrow).trim() !== "";
              const hasHeading = tile.heading && String(tile.heading).trim() !== "";
              const hasButton = tile.buttonLabel && String(tile.buttonLabel).trim() !== "" && tile.buttonLink && String(tile.buttonLink).trim() !== "";

              return (
                <div 
                  key={tile.id || idx}
                  className="relative overflow-hidden rounded-xl min-h-[210px] py-8 px-6 group shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-center border border-stone-100/5 select-none"
                  style={{ backgroundColor: tile.bgColor || '#022b17' }}
                >
                  {/* Background Image if position is Cover */}
                  {bgImage && isCover && (
                    <img 
                      src={bgImage} 
                      alt={tile.heading || 'Promo'} 
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  )}

                  {/* Right-aligned floating image if not Cover (mockup style) */}
                  {bgImage && !isCover && (
                    <div className="absolute right-3 bottom-0 top-0 w-[42%] h-full flex items-center justify-end pointer-events-none select-none z-10 p-2">
                      <img 
                        src={bgImage} 
                        alt={tile.heading || 'Promo'} 
                        referrerPolicy="no-referrer"
                        className="max-h-[85%] max-w-full object-contain object-right group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                      />
                    </div>
                  )}

                  {/* Overlay Tint (only if cover image is active) */}
                  {isCover && overlayBg !== 'transparent' && (
                    <div 
                      className="absolute inset-0 transition-opacity duration-300"
                      style={{ backgroundColor: overlayBg }}
                    />
                  )}

                  {/* Content Area */}
                  <div className={`relative z-20 flex flex-col items-start gap-2.5 ${isCover ? 'w-full' : 'w-[58%]'}`}>
                    {hasEyebrow && (
                      <span 
                        className={`${eyebrowFont} text-[10px] md:text-xs font-bold tracking-widest uppercase`}
                        style={{ color: tile.eyebrowColor || '#be9023' }}
                      >
                        {tile.eyebrow}
                      </span>
                    )}
                    {hasHeading && (
                      <h3 
                        className={`${headingFont} ${headingSize} font-bold leading-snug`}
                        style={{ color: tile.headingColor || '#ffffff' }}
                      >
                        {tile.heading}
                      </h3>
                    )}
                    {hasButton && (
                      <Link 
                        to={tile.buttonLink}
                        className="mt-2 text-[11px] font-bold tracking-widest uppercase px-5 py-2.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border rounded inline-flex items-center gap-2 shadow-xs"
                        style={{ 
                          backgroundColor: tile.buttonBgColor || '#be9023',
                          color: tile.buttonTextColor || '#ffffff',
                          borderColor: tile.buttonBorderColor || 'transparent'
                        }}
                      >
                        {displayLabel}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Layout: Auto-advancing Carousel */}
          <div 
            className="block md:hidden relative overflow-hidden rounded-xl aspect-[16/10] shadow-sm border border-stone-100"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div 
              className="flex w-full h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {tiles.map((tile: any, idx: number) => {
                const bgImage = tile.mobileImage || tile.desktopImage;
                const overlayBg = tile.overlayColor || 'transparent';
                const eyebrowFont = tile.eyebrowFont === 'serif' ? 'font-serif' : tile.eyebrowFont === 'cinzel' ? 'font-serif uppercase tracking-wider' : 'font-sans';
                const headingFont = getHeadingFontClass(tile.headingFont);
                const headingSize = getHeadingSizeClass(tile.headingSize);
                const isCover = tile.imagePosition === 'cover';

                const rawLabel = tile.buttonLabel || '';
                const displayLabel = rawLabel.endsWith('→') || rawLabel.endsWith('➔') ? rawLabel : `${rawLabel} →`;

                const hasEyebrow = tile.eyebrow && String(tile.eyebrow).trim() !== "";
                const hasHeading = tile.heading && String(tile.heading).trim() !== "";
                const hasButton = tile.buttonLabel && String(tile.buttonLabel).trim() !== "" && tile.buttonLink && String(tile.buttonLink).trim() !== "";

                return (
                  <div 
                    key={tile.id || idx}
                    className="relative w-full h-full shrink-0 flex flex-col justify-center px-5 py-6"
                    style={{ backgroundColor: tile.bgColor || '#022b17' }}
                  >
                    {/* Background Image if position is Cover */}
                    {bgImage && isCover && (
                      <img 
                        src={bgImage} 
                        alt={tile.heading || 'Promo'} 
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Right-aligned floating image if not Cover (mockup style) */}
                    {bgImage && !isCover && (
                      <div className="absolute right-2 bottom-0 top-0 w-[42%] h-full flex items-center justify-end pointer-events-none select-none z-10 p-1.5">
                        <img 
                          src={bgImage} 
                          alt={tile.heading || 'Promo'} 
                          referrerPolicy="no-referrer"
                          className="max-h-[85%] max-w-full object-contain object-right"
                        />
                      </div>
                    )}

                    {/* Overlay Tint */}
                    {isCover && overlayBg !== 'transparent' && (
                      <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: overlayBg }}
                      />
                    )}

                    {/* Content Area */}
                    <div className={`relative z-20 flex flex-col items-start gap-1.5 ${isCover ? 'w-full' : 'w-[58%]'}`}>
                      {hasEyebrow && (
                        <span 
                          className={`${eyebrowFont} text-[9px] font-bold tracking-widest uppercase`}
                          style={{ color: tile.eyebrowColor || '#be9023' }}
                        >
                          {tile.eyebrow}
                        </span>
                      )}
                      {hasHeading && (
                        <h3 
                          className={`${headingFont} ${headingSize} font-bold leading-snug`}
                          style={{ color: tile.headingColor || '#ffffff' }}
                        >
                          {tile.heading}
                        </h3>
                      )}
                      {hasButton && (
                        <Link 
                          to={tile.buttonLink}
                          className="mt-1 text-[10px] font-bold tracking-widest uppercase px-4 py-2 border rounded inline-flex items-center gap-1.5"
                          style={{ 
                            backgroundColor: tile.buttonBgColor || '#be9023',
                            color: tile.buttonTextColor || '#ffffff',
                            borderColor: tile.buttonBorderColor || 'transparent'
                          }}
                        >
                          {displayLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Indicator Dots */}
            {tiles.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {tiles.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${currentSlide === i ? 'bg-amber-500 w-3.5' : 'bg-white/40'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM ROW: TRUST BADGES STRIP */}
      {badges.length > 0 && (
        <div className="w-full bg-[#fbf9f4] border-y border-stone-200/60 py-6">
          <div className="w-full px-4 md:px-8 xl:px-12">
            {/* Force single horizontal row on mobile with hidden scrollbars, desktop has normal wrap/flex */}
            <div 
              className="flex flex-nowrap overflow-x-auto gap-8 md:gap-4 md:grid md:grid-cols-5 md:justify-items-center scrollbar-none pb-1 md:pb-0"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {badges.map((badge: any, idx: number) => (
                <div 
                  key={badge.id || idx}
                  className="flex items-center gap-3.5 shrink-0 select-none max-w-[240px] md:max-w-none"
                >
                  {renderBadgeIcon(badge)}
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold tracking-wider text-stone-800 uppercase whitespace-nowrap">
                      {badge.title}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium whitespace-nowrap mt-0.5">
                      {badge.subtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export const DEFAULT_PAGE_SECTIONS = [
  { id: 'sec-hero', type: 'Hero Banner', content: {} },
  { id: 'sec-categories', type: 'Category Cards', content: {} },
  { id: 'sec-products-featured', type: 'Product Carousel', content: { title: 'Featured Sovereign Jewellery', productsType: 'featured' } },
  { id: 'sec-story', type: 'About Collection', content: {} },
  { id: 'sec-products-new', type: 'Product Carousel', content: { title: 'Fresh Showroom Arrivals', productsType: 'new' } },
  { id: 'sec-split', type: 'Split Media Banner', content: {} },
  { id: 'sec-boutiques', type: 'Our Boutiques', content: {} },
  { id: 'sec-inquiries', type: 'Inquiries & Commissions', content: {} }
];

export function Home({
  pageId = 'home',
  isBuilder = false,
  sectionsOverride,
  pageSections: pageSectionsProp,
  loadingSections: loadingSectionsProp,
  onAddSectionClick,
  onDeleteSectionClick,
  onReorderSections,
  onSectionClick,
  selectedSectionId,
  seoData
}: HomeProps = {}): React.JSX.Element {
  const { settings } = useWebsiteSettings();
  
  // Dynamic Section & SEO State
  const [pageSections, setPageSections] = useState<any[]>([]);
  const [pageSeo, setPageSeo] = useState<any>(null);
  const [loadingSections, setLoadingSections] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const currentSections = pageSectionsProp || sectionsOverride || pageSections;
  const currentLoadingSections = pageSectionsProp !== undefined ? (loadingSectionsProp ?? false) : loadingSections;

  // Real-time & Loaded States
  const [banners, setBanners] = useState<any[]>([]);
  const [metalPrices, setMetalPrices] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [currentStoreIdx, setCurrentStoreIdx] = useState(0);
  const [isBoutiqueInteracting, setIsBoutiqueInteracting] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [currentTestimonialIdx, setCurrentTestimonialIdx] = useState(0);
  const [isTestimonialsInteracting, setIsTestimonialsInteracting] = useState(false);

  // Load Status tracking
  const [loadingBanners, setLoadingBanners] = useState(isFirebaseConfigured);
  const [loadingPrices, setLoadingPrices] = useState(isFirebaseConfigured);
  const [loadingCollections, setLoadingCollections] = useState(isFirebaseConfigured);
  const [loadingCategories, setLoadingCategories] = useState(isFirebaseConfigured);
  const [loadingFeatured, setLoadingFeatured] = useState(isFirebaseConfigured);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(isFirebaseConfigured);
  const [loadingStores, setLoadingStores] = useState(isFirebaseConfigured);
  const [loadingTestimonials, setLoadingTestimonials] = useState(isFirebaseConfigured);

  // Last update tracker
  const [lastUpdatedPrice, setLastUpdatedPrice] = useState<string>('');

  // Fallback state trackers
  const [fallbackActive, setFallbackActive] = useState(!isFirebaseConfigured);

  // Load page sections (builder vs viewer)
  useEffect(() => {
    if (isBuilder && sectionsOverride) {
      setPageSections(sectionsOverride);
      setLoadingSections(false);
      return;
    }

    if (!isFirebaseConfigured || !db) {
      setPageSections(DEFAULT_PAGE_SECTIONS);
      setLoadingSections(false);
      return;
    }

    // Subscribe to page sections for the home page (or specific pageId)
    const targetDocId = pageId || 'home';
    const docRef = doc(db, 'pageSections', targetDocId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.sections) && data.sections.length > 0) {
          setPageSections(data.sections);
        } else {
          setPageSections(DEFAULT_PAGE_SECTIONS);
        }
        if (data && data.seo) {
          setPageSeo(data.seo);
        }
      } else {
        setPageSections(DEFAULT_PAGE_SECTIONS);
      }
      setLoadingSections(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `pageSections/${targetDocId}`);
      setPageSections(DEFAULT_PAGE_SECTIONS);
      setLoadingSections(false);
    });

    return () => unsubscribe();
  }, [isBuilder, sectionsOverride, pageId]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Gracefully default to highly realistic mock datasets instantly (Priority Rule 1)
      setBanners(mockBanners);
      setMetalPrices(mockMetalPrices);
      setCollections(mockCollections);
      setCategories(DEFAULT_CATEGORIES_MOCK);
      setFeaturedProducts(mockProducts.filter(p => p.isPopular));
      setNewArrivalProducts(mockProducts.filter(p => !p.isPopular));
      setStores(mockStores);
      setTestimonials(defaultMockTestimonials);
      setLastUpdatedPrice('Live Demo Backup');
      setFallbackActive(true);
      setLoadingTestimonials(false);
      return;
    }

    // 1. Live Banner Real-time Stream
    // status=active, ordered by displayOrder (client sorted to protect against missing compound indexes)
    const bannersRef = collection(db, 'banners');
    const bannersQuery = query(bannersRef, where('status', '==', 'active'));
    
    const unsubscribeBanners = onSnapshot(bannersQuery, (snapshot) => {
      try {
        const now = new Date();
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            subtitle: data.subtitle || '',
            image: data.imageUrl || data.image || '',
            buttonText: data.buttonText || 'EXPLORE MASTERPIECES',
            buttonLink: data.linkUrl || data.buttonLink || '/catalog',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 99,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
          };
        })
        // Filter campaign dates locally for safety
        .filter(b => {
          if (b.startDate && b.startDate > now) return false;
          if (b.endDate && b.endDate < now) return false;
          return true;
        })
        // Sort by displayOrder
        .sort((a, b) => a.displayOrder - b.displayOrder);

        if (items.length > 0) {
          setBanners(items);
        } else {
          setBanners(mockBanners); // Fallback if database is active but empty
        }
        setLoadingBanners(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'banners');
        setBanners(mockBanners);
        setLoadingBanners(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'banners');
      setBanners(mockBanners);
      setLoadingBanners(false);
    });

    // 2. Live Metal Rates Real-time Stream
    const pricesRef = collection(db, 'metalPrices');
    const unsubscribePrices = onSnapshot(pricesRef, (snapshot) => {
      try {
        if (snapshot.empty) {
          setMetalPrices(mockMetalPrices);
          setLastUpdatedPrice('Pre-loaded Market Rates');
          setLoadingPrices(false);
          return;
        }

        const items = snapshot.docs
          .map(doc => {
            const data = doc.data();
            // Extract dynamic updated timestamp
            let updateTimeStr = '';
            if (data.updatedAt) {
              const upVal = data.updatedAt;
              if (upVal instanceof Timestamp) {
                updateTimeStr = upVal.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', ' + upVal.toDate().toLocaleDateString('en-IN');
              } else {
                const parsedDate = new Date(upVal);
                updateTimeStr = isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleTimeString('en-IN') + ', ' + parsedDate.toLocaleDateString('en-IN');
              }
            }
            return {
              id: doc.id,
              metal: data.metal || data.metalType || data.metalName || '',
              pricePerGram: Number(data.pricePerGram || data.ratePerGram || data.price || 0),
              change: Number(data.change || 0),
              unit: data.unit || '1g',
              status: data.status || 'active',
              displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 9999,
              updateTimeStr
            };
          })
          .filter(p => p.status === 'active');

        items.sort((a, b) => a.displayOrder - b.displayOrder);

        // Set last updated tracker
        const timestamps = items.map(item => item.updateTimeStr).filter(Boolean);
        if (timestamps.length > 0) {
          setLastUpdatedPrice(timestamps[0]);
        } else {
          setLastUpdatedPrice(new Date().toLocaleTimeString('en-IN') + ', ' + new Date().toLocaleDateString('en-IN'));
        }

        setMetalPrices(items);
        setLoadingPrices(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'metalPrices');
        setMetalPrices(mockMetalPrices);
        setLoadingPrices(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'metalPrices');
      setMetalPrices(mockMetalPrices);
      setLoadingPrices(false);
    });

    // 3. Fetch Active Collections (getDocs)
    const fetchCollections = async () => {
      try {
        const collectionsRef = collection(db, 'collections');
        // Accept either isActive or status active for maximum resilience
        const snapshot = await getDocs(collectionsRef);
        
        let items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            imageUrl: data.imageUrl || data.coverImageUrl || '',
            slug: data.slug || '',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : (typeof data.order === 'number' ? data.order : 99),
            status: data.status || (data.isActive ? 'active' : 'inactive')
          };
        })
        .filter(c => c.status === 'active')
        .sort((a, b) => a.displayOrder - b.displayOrder);

        if (items.length > 0) {
          setCollections(items);
        } else {
          setCollections(mockCollections);
        }
        setLoadingCollections(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'collections');
        setCollections(mockCollections);
        setLoadingCollections(false);
      }
    };
    fetchCollections();

    // 4. Fetch All Published Products
    const fetchAllProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef, 
          where('status', '==', 'published')
        );
        const snapshot = await getDocs(q);
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            name: data.name || data.productName || '',
            sku: data.sku || data.productCode || '',
            description: data.description || '',
            category: data.category || data.categoryId || '',
            collection: data.collection || data.collectionId || '',
            metalType: data.metalType || data.purity || '',
            approxWeight: data.approxWeight || (data.grossWeight ? `${data.grossWeight}g` : ''),
            imageUrl: data.imageUrl || data.thumbnailUrl || (data.images && data.images[0]) || '',
            featured: data.featured === true,
            newArrival: data.newArrival === true,
            isPopular: data.featured === true,
            badgeLabel: data.badgeLabel || '',
            badgeColor: data.badgeColor || '#927230',
            rating: data.rating !== undefined && data.rating !== null ? Number(data.rating) : null,
            reviewCount: data.reviewCount !== undefined && data.reviewCount !== null ? Number(data.reviewCount) : null,
            price: data.price !== undefined && data.price !== null ? Number(data.price) : 0,
            mrp: data.mrp !== undefined && data.mrp !== null ? Number(data.mrp) : null,
            priceVisibility: data.priceVisibility !== undefined ? data.priceVisibility : true
          };
        });

        if (items.length > 0) {
          setAllProducts(items);
          setFeaturedProducts(items.filter(p => p.featured));
          setNewArrivalProducts(items.filter(p => p.newArrival));
        } else {
          // If Firestore exists but is unpopulated, fallback to mock data
          setAllProducts(mockProducts);
          setFeaturedProducts(mockProducts.filter(p => p.isPopular));
          setNewArrivalProducts(mockProducts.filter(p => !p.isPopular));
        }
        setLoadingFeatured(false);
        setLoadingNewArrivals(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'products');
        setAllProducts(mockProducts);
        setFeaturedProducts(mockProducts.filter(p => p.isPopular));
        setNewArrivalProducts(mockProducts.filter(p => !p.isPopular));
        setLoadingFeatured(false);
        setLoadingNewArrivals(false);
      }
    };
    fetchAllProducts();

    // 6. Fetch Active Stores
    const fetchStores = async () => {
      try {
        const storesRef = collection(db, 'stores');
        const snapshot = await getDocs(storesRef);
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || data.whatsappNumber || '',
            hours: data.hours || data.workingHours || '',
            openingTime: data.openingTime || '',
            closingTime: data.closingTime || '',
            weeklyOff: data.weeklyOff || '',
            mapUrl: data.mapUrl || data.mapEmbedUrl || '',
            imageUrl: data.imageUrl || '',
            status: data.status || (data.isActive ? 'active' : 'inactive')
          };
        })
        .filter(s => s.status === 'active');

        if (items.length > 0) {
          setStores(items);
        } else {
          setStores(mockStores);
        }
        setLoadingStores(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'stores');
        setStores(mockStores);
        setLoadingStores(false);
      }
    };
    fetchStores();

    // 7. Live Categories Real-time Stream
    const categoriesRef = collection(db, 'categories');
    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      try {
        if (snapshot.empty) {
          setCategories(DEFAULT_CATEGORIES_MOCK);
          setLoadingCategories(false);
          return;
        }
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            imageUrl: data.imageUrl || data.coverImageUrl || '',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : (typeof data.order === 'number' ? data.order : 99),
            status: data.status || (data.isActive ? 'active' : 'inactive'),
            offerTag: data.offerTag || '',
            customTitle: data.customTitle || '',
            customSubtitle: data.customSubtitle || '',
            fontStyle: data.fontStyle || 'serif',
            textColor: data.textColor || '#ffffff',
            subtitleColor: data.subtitleColor || '#fecdd3',
            offerTagColor: data.offerTagColor || '#ffffff',
            offerTagBgColor: data.offerTagBgColor || '#e11d48',
            overlayShadeColor: data.overlayShadeColor || '#000000'
          };
        })
        .filter(c => c.status === 'active')
        .sort((a, b) => a.displayOrder - b.displayOrder);

        if (items.length > 0) {
          setCategories(items);
        } else {
          setCategories(DEFAULT_CATEGORIES_MOCK);
        }
        setLoadingCategories(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'categories');
        setCategories(DEFAULT_CATEGORIES_MOCK);
        setLoadingCategories(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
      setCategories(DEFAULT_CATEGORIES_MOCK);
      setLoadingCategories(false);
    });

    // 4. Live Testimonials Real-time Stream
    const testimonialsRef = collection(db, 'testimonials');
    const unsubscribeTestimonials = onSnapshot(testimonialsRef, (snapshot) => {
      try {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((t: any) => t.status === 'active')
        .sort((a: any, b: any) => (a.displayOrder || 1) - (b.displayOrder || 1));

        if (items.length > 0) {
          setTestimonials(items);
        } else {
          setTestimonials(defaultMockTestimonials);
        }
        setLoadingTestimonials(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'testimonials');
        setTestimonials(defaultMockTestimonials);
        setLoadingTestimonials(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
      setTestimonials(defaultMockTestimonials);
      setLoadingTestimonials(false);
    });

    // Clean up streams on unmount
    return () => {
      unsubscribeBanners();
      unsubscribePrices();
      unsubscribeCategories();
      unsubscribeTestimonials();
    };
  }, []);

  useEffect(() => {
    if (stores.length <= 1 || isBoutiqueInteracting) return;

    const interval = setInterval(() => {
      setCurrentStoreIdx((prev) => (prev + 1) % stores.length);
    }, 5500); // Auto-advance every 5.5 seconds

    return () => clearInterval(interval);
  }, [stores, isBoutiqueInteracting]);

  useEffect(() => {
    if (testimonials.length <= 1 || isTestimonialsInteracting) return;

    const interval = setInterval(() => {
      setCurrentTestimonialIdx((prev) => (prev + 1) % testimonials.length);
    }, 4500); // Auto-advance every 4.5 seconds

    return () => clearInterval(interval);
  }, [testimonials, isTestimonialsInteracting]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const storeTouchStartX = useRef<number | null>(null);
  const storeTouchEndX = useRef<number | null>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const getCategoryFontStyle = (style?: string) => {
    switch (style) {
      case 'sans':
        return { fontFamily: "'Inter', sans-serif" };
      case 'cursive':
        return { fontFamily: "'Dancing Script', 'Brush Script MT', cursive", fontStyle: 'italic' };
      case 'mono':
        return { fontFamily: "Courier New, monospace" };
      case 'serif':
      default:
        return { fontFamily: "'Playfair Display', Georgia, serif" };
    }
  };

  const getHeaderFontStyle = (style?: string) => {
    switch (style) {
      case 'sans':
        return { fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" };
      case 'cursive':
        return { fontFamily: "'Sacramento', 'Dancing Script', cursive" };
      case 'mono':
        return { fontFamily: "'Courier Prime', 'Courier New', monospace" };
      case 'cinzel':
        return { fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" };
      case 'cormorant':
        return { fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" };
      case 'marcellus':
        return { fontFamily: "'Marcellus', 'Playfair Display', Georgia, serif" };
      case 'lobster':
        return { fontFamily: "'Lobster', cursive" };
      case 'alex-brush':
        return { fontFamily: "'Alex Brush', 'Dancing Script', cursive" };
      case 'poppins':
        return { fontFamily: "'Poppins', 'Inter', sans-serif" };
      case 'serif':
      default:
        return { fontFamily: "'Playfair Display', Georgia, serif" };
    }
  };

  const getTextStyle = (styles: any, defaultColor: string, defaultFontFamily: 'serif' | 'sans') => {
    const familyStyle = { fontFamily: getFontFamilyName(styles?.fontFamily, defaultFontFamily) };
    return {
      color: styles?.color || defaultColor,
      fontSize: styles?.fontSize ? (typeof styles.fontSize === 'number' ? `${styles.fontSize}px` : styles.fontSize) : undefined,
      ...familyStyle
    };
  };

  const getButtonStyle = (btn: any, defaultStyleType: 'filled' | 'outlined') => {
    if (!btn) return undefined;
    const styleType = btn.styleType || defaultStyleType;
    const styleObj: any = {};
    if (btn.bgColor) {
      if (styleType !== 'outlined') {
        styleObj.backgroundColor = btn.bgColor;
      } else {
        styleObj.borderColor = btn.bgColor;
        styleObj.borderWidth = '1px';
        styleObj.borderStyle = 'solid';
      }
    }
    if (btn.textColor) {
      styleObj.color = btn.textColor;
    }
    if (btn.fontSize) {
      styleObj.fontSize = typeof btn.fontSize === 'number' ? `${btn.fontSize}px` : btn.fontSize;
    }
    if (btn.fontFamily) {
      styleObj.fontFamily = getFontFamilyName(btn.fontFamily, 'sans');
    }
    return styleObj;
  };

  // --- Section Sub-renders for Visual Page Builder ---

  const renderHeroBanner = (content: any = {}) => {
    // Determine the list of banners to display.
    // If specific banners are configured in the section content (e.g. customized for a custom page), use them.
    // Otherwise, default to the live global banners loaded from the Firestore collection / mock data.
    const activeBanners = (content && Array.isArray(content.banners) && content.banners.length > 0)
      ? content.banners
      : banners;

    return (
      <div id="home-hero-banner-carousel" className="w-full relative py-4">
        <BannerSlider banners={activeBanners} />
      </div>
    );
  };

  const renderCategoryCards = (content: any = {}) => {
    const sanitizeEyebrow = (tag: any): string => {
      if (!tag || typeof tag !== 'string') return '';
      // Clean up garbled text like -[;IUO9NH or similar garbage signatures
      if (tag.includes('[;') || tag.includes(';') || tag.includes('IUO') || tag.includes('-[;')) {
        return 'OUR CATEGORIES';
      }
      return tag;
    };

    const rawEyebrow = content.eyebrow !== undefined ? content.eyebrow : settings.categoryShowcaseEyebrowTag;
    const eyebrow = sanitizeEyebrow(rawEyebrow);

    const title = content.title !== undefined ? content.title : (settings.categoryShowcaseTitle || 'Shop by Category');
    const subtitle = content.subtitle !== undefined ? content.subtitle : settings.categoryShowcaseSubtitle;

    const eyebrowColor = content.eyebrowColor || settings.categoryShowcaseEyebrowColor || '#e11d48';
    const titleColor = content.titleColor || content.titleStyle?.color || settings.categoryShowcaseHeaderTextColor || '#1c1917';
    const subtitleColor = content.subtitleColor || content.subtitleStyle?.color || settings.categoryShowcaseSubtitleColor || '#78716c';

    const hasEyebrow = eyebrow && eyebrow.trim().length > 0;
    const hasTitle = title && title.trim().length > 0;
    const hasSubtitle = subtitle && subtitle.trim().length > 0;
    const hasAnyHeader = hasEyebrow || hasTitle || hasSubtitle;

    const displayCategories = (content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0)
      ? categories.filter(cat => content.selectedIds.includes(cat.id))
      : categories;

    return (
      <section className="py-6 md:py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6" id="category-showcase-section">
        {/* Conditional Header Rendering */}
        <SectionHeader
          tag={eyebrow}
          title={title}
          subtitle={subtitle}
          tagStyle={{ color: eyebrowColor }}
          titleStyle={{
            ...getHeaderFontStyle(settings.categoryShowcaseHeaderFontStyle),
            color: titleColor,
            lineHeight: '1.2'
          }}
          subtitleStyle={{ color: subtitleColor }}
          align="center"
          showLine={false}
          className="mb-6"
        />

        {/* Categories Scroller Container with pink accents */}
        <div className="relative group/scroller">
          {/* Arrow Left (Desktop) */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/95 text-rose-950 rounded-full shadow-lg border border-rose-100 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center cursor-pointer"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Arrow Right (Desktop) */}
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/95 text-rose-950 rounded-full shadow-lg border border-rose-100 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover/scroller:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center cursor-pointer"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Scrolling Grid */}
          {loadingCategories ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4" id="categories-skeleton">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="flex-shrink-0 w-44 md:w-56 aspect-[3/4] bg-stone-200 animate-pulse rounded-xl border border-stone-300" />
              ))}
            </div>
          ) : displayCategories.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-200 rounded-xl" id="categories-empty-state">
              <Tags className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No design categories currently configured.</p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className={`
                scrollbar-none overflow-x-auto gap-4 pb-4 select-none scroll-smooth
                ${settings.categoryShowcaseLayout === 'double' 
                  ? 'grid grid-rows-2 grid-flow-col auto-cols-[11rem] md:auto-cols-[14rem]' 
                  : 'flex auto-cols-max'
                }
              `}
            >
              {displayCategories.map((cat) => {
                const itemLink = `/category/${cat.slug || cat.id}`;
                return (
                  <Link
                    key={cat.id}
                    to={itemLink}
                    className={`
                      snap-start flex-shrink-0 relative rounded-xl overflow-hidden group/tile
                      shadow-xs hover:shadow-lg hover:shadow-rose-100/50 border border-rose-100/40 transition-all duration-300
                      ${settings.categoryShowcaseLayout === 'double'
                        ? 'w-full aspect-[4/3] h-28 md:h-36'
                        : 'w-44 md:w-56 aspect-[3/4]'
                      }
                    `}
                  >
                    {/* Offer Tag Badge */}
                    {cat.offerTag && (
                      <div 
                        className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 text-[8px] md:text-[9px] font-sans font-bold uppercase tracking-wider rounded-md shadow-sm border border-black/5"
                        style={{
                          color: cat.offerTagColor || '#ffffff',
                          backgroundColor: cat.offerTagBgColor || '#e11d48'
                        }}
                      >
                        {cat.offerTag}
                      </div>
                    )}

                    {/* Category Image */}
                    <div className="w-full h-full bg-rose-50/50 relative overflow-hidden">
                      {cat.imageUrl ? (
                        (() => {
                          const isVideo = cat.imageUrl.toLowerCase().endsWith('.mp4') || 
                                          cat.imageUrl.toLowerCase().endsWith('.mov') || 
                                          cat.imageUrl.toLowerCase().endsWith('.webm') || 
                                          cat.imageUrl.toLowerCase().endsWith('.m4v');
                          if (isVideo) {
                            return (
                              <video
                                src={cat.imageUrl}
                                className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-500"
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
                            );
                          }
                          return (
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-500"
                            />
                          );
                        })()
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50/20 text-rose-300">
                          <Tags className="w-8 h-8 opacity-40 mb-1" />
                          <span className="text-[10px] font-medium tracking-wider uppercase">Parasmoni</span>
                        </div>
                      )}

                      {/* Customizable Overlay Gradient / Seeds */}
                      <div 
                        className="absolute inset-0 transition-all duration-300" 
                        style={
                          cat.overlayShadeColor === 'transparent'
                            ? { background: 'transparent' }
                            : {
                                background: `linear-gradient(to top, ${cat.overlayShadeColor || '#4c0519'}ec, ${cat.overlayShadeColor || '#4c0519'}70, transparent)`
                              }
                        }
                      />
                    </div>

                    {/* Category Name Overlay at bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-3 md:p-4 text-center z-10 flex flex-col items-center justify-end pb-4 md:pb-5">
                      <span 
                        className="block text-xs md:text-sm font-bold tracking-wide transition-colors line-clamp-1 drop-shadow-xs"
                        style={{
                          ...getCategoryFontStyle(cat.fontStyle),
                          color: cat.textColor || '#ffffff'
                        }}
                      >
                        {cat.customTitle || cat.name}
                      </span>
                      {cat.customSubtitle && (
                        <span 
                          className="block mt-0.5 text-[10px] md:text-xs tracking-wide transition-colors line-clamp-1 opacity-90"
                          style={{
                            ...getCategoryFontStyle(cat.fontStyle),
                            color: cat.subtitleColor || '#fecdd3'
                          }}
                        >
                          {cat.customSubtitle}
                        </span>
                      )}
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold text-rose-200 opacity-0 group-hover/tile:opacity-100 transform translate-y-1 group-hover/tile:translate-y-0 transition-all duration-300">
                        Explore Now &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderQuickCategoryStrip = (content: any = {}) => {
    const title = content.title || '';
    const titleColor = content.titleColor || '#1c1917';
    const displayCategories = (content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0)
      ? categories.filter(cat => content.selectedIds.includes(cat.id))
      : categories;

    if (displayCategories.length === 0) return null;

    return (
      <section className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-4 font-sans" id="quick-category-strip-section">
        {title.trim().length > 0 && (
          <h2 
            className="text-xs sm:text-sm font-bold tracking-widest uppercase text-left font-serif border-b border-stone-200 pb-2 flex items-center gap-2"
            style={{ color: titleColor }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{title}</span>
          </h2>
        )}

        <div className="flex items-center gap-2 relative">
          <div 
            className="w-full overflow-x-auto flex flex-nowrap gap-5 sm:gap-8 scrollbar-none py-2 px-1 scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {displayCategories.map((cat) => {
              const itemLink = `/category/${cat.slug || cat.id}`;
              const imageSrc = cat.imageUrl || cat.image || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=150";
              return (
                <Link
                  key={cat.id}
                  to={itemLink}
                  className="flex flex-col items-center gap-2 text-center shrink-0 group focus:outline-none"
                >
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-stone-200 hover:border-[#6B1F2A] group-hover:scale-105 transition-all duration-300 p-0.5 bg-white shadow-xs">
                      <img 
                        src={imageSrc} 
                        alt={cat.name} 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <span className="block text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-700 group-hover:text-[#6B1F2A] transition-colors max-w-[80px] sm:max-w-[100px] truncate leading-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderTestimonials = (content: any = {}) => {
    const title = content.title || 'What Our Customers Say';
    const subtitle = content.subtitle || 'Discover why generations of families trust Parasmoni Jewellers for their most precious milestones.';
    const titleColor = content.titleColor || '#1c1917';
    const subtitleColor = content.subtitleColor || '#78716c';

    const quoteCardBg = content.quoteCardBg || '#ffffff';

    if (testimonials.length === 0) return null;

    // Helper to shift arrays so each column starts with a different offset of reviews
    const getShiftedList = (arr: any[], shift: number) => {
      if (arr.length === 0) return [];
      const realShift = shift % arr.length;
      return [...arr.slice(realShift), ...arr.slice(0, realShift)];
    };

    // Helper to ensure each column is fully populated and duplicated end-to-end for seamless vertical loop points
    const prepareMarqueeItems = (arr: any[]) => {
      if (arr.length === 0) return [];
      let base = [...arr];
      while (base.length < 5) {
        base = [...base, ...arr];
      }
      return [...base, ...base];
    };

    // Columns config
    const col1Items = prepareMarqueeItems(getShiftedList(testimonials, 0));
    const col2Items = prepareMarqueeItems(getShiftedList(testimonials, Math.floor(testimonials.length / 4) || 1));
    const col3Items = prepareMarqueeItems(getShiftedList(testimonials, Math.floor(testimonials.length / 2) || 2));
    const col4Items = prepareMarqueeItems(getShiftedList(testimonials, Math.floor((3 * testimonials.length) / 4) || 3));

    // Card Renderer Helper
    const renderCard = (test: any, index: number) => {
      const isPhoto = test.type === 'photo';

      if (isPhoto) {
        return (
          <div 
            key={`${test.id}-${index}`}
            className="border border-[#B8860B]/15 hover:border-[#6B1F2A]/30 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl relative h-[320px] w-full overflow-hidden shrink-0 group flex flex-col justify-end"
            style={{ backgroundColor: '#0c0a09' }}
          >
            {test.reviewerPhotoUrl ? (
              <img 
                src={test.reviewerPhotoUrl} 
                alt={test.reviewText || "Customer photo"} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-stone-900 flex items-center justify-center">
                <User className="w-10 h-10 text-stone-700" />
              </div>
            )}
            {test.reviewText && test.reviewText.trim().length > 0 && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12 pb-4 px-4 flex flex-col justify-end z-10">
                <p className="text-white text-xs font-sans font-medium tracking-wide leading-relaxed filter drop-shadow-md">
                  {test.reviewText}
                </p>
              </div>
            )}
          </div>
        );
      }

      const rating = test.rating || 5;
      return (
        <div 
          key={`${test.id}-${index}`}
          className="border border-[#B8860B]/15 hover:border-[#6B1F2A]/30 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl p-6 relative flex flex-col justify-between space-y-4 shrink-0"
          style={{ backgroundColor: quoteCardBg }}
        >
          {/* Decorative Quotation Mark Icon + Rating Star */}
          <div className="text-[#6B1F2A]/80 flex justify-between items-start">
            <Quote className="w-8 h-8 fill-current text-[#6B1F2A]/90 stroke-[1]" />
            <div className="flex items-center gap-1 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-full text-xs">
              <span className="text-amber-500">★</span>
              <span className="font-bold text-stone-700 text-[10px] md:text-xs">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Review Text */}
          <p className="font-serif italic text-stone-700 text-sm leading-relaxed">
            "{test.reviewText || ""}"
          </p>

          {/* Bottom Metas (Avatar, Name, Location) */}
          <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
            {/* Avatar Photo */}
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#B8860B]/30 bg-stone-50 shadow-sm">
              {test.reviewerPhotoUrl ? (
                <img 
                  src={test.reviewerPhotoUrl} 
                  alt={test.reviewerName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                  <User className="w-1/2 h-1/2 text-stone-400" />
                </div>
              )}
            </div>

            {/* Name + Location Column */}
            <div className="flex flex-col text-left overflow-hidden min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-sans font-bold text-xs md:text-sm text-stone-800 truncate leading-none">
                  {test.reviewerName}
                </span>
                {test.verifiedBadge && (
                  <span className="inline-flex items-center text-emerald-600 bg-emerald-50 p-0.5 rounded-full" title="Verified Customer">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                  </span>
                )}
              </div>
              <span className="font-sans text-[10px] md:text-xs text-stone-500 mt-1 truncate leading-none">
                {test.reviewerLocation || 'Verified Patron'}
              </span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <section 
        className="py-16 md:py-24 bg-[#FAF9F6] relative overflow-hidden" 
        id="testimonials-marquee-section"
      >
        {/* Style Tag containing CSS Animation Keyframes and Pause on Hover properties */}
        <style>{`
          @keyframes marquee-scroll-up {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          @keyframes marquee-scroll-down {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0); }
          }
          .animate-marquee-up {
            animation: marquee-scroll-up 38s linear infinite;
          }
          .animate-marquee-down {
            animation: marquee-scroll-down 38s linear infinite;
          }
          .marquee-col {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
        `}</style>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Header */}
          <SectionHeader
            tag="PARASMONI PATRONS"
            title={title}
            subtitle={subtitle}
            tagStyle={{ color: '#6B1F2A' }}
            titleStyle={{ color: titleColor }}
            subtitleStyle={{ color: subtitleColor }}
            align="center"
            showLine={true}
            className="max-w-2xl mx-auto mb-12"
          />

          {/* Marquee Wall Container */}
          <div className="relative h-[650px] overflow-hidden rounded-3xl border border-stone-200/50 bg-stone-50/50 p-4 md:p-8 shadow-inner">
            {/* Soft Top/Bottom Vignette Fades to hide hard scroll edges elegantly */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#FAF9F6] to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#FAF9F6] to-transparent z-10 pointer-events-none" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 h-full overflow-hidden">
              {/* Column 1: UP - Always Visible */}
              <div className="h-full overflow-hidden relative">
                <div className="marquee-col animate-marquee-up hover:[animation-play-state:paused] active:[animation-play-state:paused] cursor-grab active:cursor-grabbing">
                  {col1Items.map((item, i) => renderCard(item, i))}
                </div>
              </div>

              {/* Column 2: DOWN - Visible from sm: breakpoint */}
              <div className="h-full overflow-hidden relative hidden sm:block">
                <div className="marquee-col animate-marquee-down hover:[animation-play-state:paused] active:[animation-play-state:paused] cursor-grab active:cursor-grabbing">
                  {col2Items.map((item, i) => renderCard(item, i))}
                </div>
              </div>

              {/* Column 3: UP - Visible from lg: breakpoint */}
              <div className="h-full overflow-hidden relative hidden lg:block">
                <div className="marquee-col animate-marquee-up hover:[animation-play-state:paused] active:[animation-play-state:paused] cursor-grab active:cursor-grabbing">
                  {col3Items.map((item, i) => renderCard(item, i))}
                </div>
              </div>

              {/* Column 4: DOWN - Visible from lg: breakpoint */}
              <div className="h-full overflow-hidden relative hidden lg:block">
                <div className="marquee-col animate-marquee-down hover:[animation-play-state:paused] active:[animation-play-state:paused] cursor-grab active:cursor-grabbing">
                  {col4Items.map((item, i) => renderCard(item, i))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderCollectionsShowcase = (content: any = {}) => {
    const title = content.title || 'Shop by Heritage Collection';
    const subtitle = content.subtitle || 'From 22K Nakashi handiwork to modern brilliant-cut diamond solitaires, discover jewellery for every generation.';
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    const displayCollections = (content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0)
      ? collections.filter(col => content.selectedIds.includes(col.id))
      : collections;

    return (
      <section className="bg-stone-100 py-10 px-4 sm:px-6" id="collections-showcase-section">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-gold-600 font-bold tracking-widest uppercase block">
                CURATED MASTERPIECES
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
                {title}
              </h2>
              <p className="text-xs max-w-lg font-medium" style={subtitleStyle}>
                {subtitle}
              </p>
            </div>
            <Link 
              to="/catalog" 
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-brand-red-600 hover:text-brand-red-700 transition-colors shrink-0 uppercase whitespace-nowrap"
            >
              <span>Browse Full Catalogue</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingCollections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="collections-skeleton">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="aspect-[4/3] bg-stone-200 animate-pulse rounded border border-stone-300"></div>
              ))}
            </div>
          ) : displayCollections.length === 0 ? (
            <div className="text-center py-12 bg-white border border-stone-200 rounded" id="collections-empty-state">
              <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No design collections published at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayCollections.map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderProductCarousel = (content: any = {}) => {
    const isNewArrivals = content?.productsType === 'new';
    const isCustom = content?.productsType === 'custom';
    const title = content?.title !== undefined ? content.title : (isNewArrivals ? 'Fresh Showroom Arrivals' : (isCustom ? 'Curated Masterpieces' : 'Featured Sovereign Jewellery'));
    
    // Subtitle is the Eyebrow in standard CMS style, but we support both fallback paths
    const eyebrowTag = content?.subtitle !== undefined ? content.subtitle : (content?.eyebrowTag !== undefined ? content.eyebrowTag : (isNewArrivals ? 'JUST REVEALED' : 'DESIGN EXCELLENCE'));
    
    // Description is the supporting subtext line in standard CMS layouts
    const description = content?.description !== undefined ? content.description : (isNewArrivals 
      ? "The latest additions straight from our master artisans' benches, capturing contemporary trends without compromising sovereign purity."
      : "Explore signature handcrafted designs renowned for heavy filigree detailing, kundan embellishments, and flawless diamonds.");
    
    const hasEyebrow = eyebrowTag && eyebrowTag.trim() !== '';
    const hasTitle = title && title.trim() !== '';
    const hasDescription = description && description.trim() !== '';

    const titleStyle = getTextStyle(content?.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content?.subtitleStyle, '#78716c', 'sans');

    let products = isNewArrivals ? newArrivalProducts : featuredProducts;
    
    if (isCustom && content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0) {
      const sourcePool = (allProducts && allProducts.length > 0) ? allProducts : mockProducts;
      products = sourcePool.filter(p => content.selectedIds.includes(p.id));
    }

    const loading = isNewArrivals ? loadingNewArrivals : loadingFeatured;

    const showHeader = (title && title.trim() !== '') || (description && description.trim() !== '');

    return (
      <section className="py-5 md:py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-4 md:space-y-6" id={isNewArrivals ? "new-arrivals-section" : "featured-masterpieces-section"}>
        <SectionHeader
          tag={eyebrowTag}
          title={title}
          subtitle={description}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
          align="center"
          showLine={false}
          className="mb-4 md:mb-6"
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-96 bg-stone-200 animate-pulse rounded border border-stone-300"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 rounded">
            <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
            <p className="text-stone-600 text-xs font-medium">No products on display currently.</p>
          </div>
        ) : (
          <ProductHorizontalCarousel products={products} whatsappNumber={mockWebsiteSettings.whatsappNumber} />
        )}
      </section>
    );
  };

  const renderAboutCollection = (content: any = {}) => {
    return <AboutCollectionSection content={content} />;
  };

  const renderWhyChooseUs = (content: any = {}) => {
    const title = content.title || 'Our Quality Benchmarks';
    const subtitle = content.subtitle || 'We adhere strictly to certifications and business ethics to safeguard your generational investments.';
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    return (
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12" id="why-choose-us-section">
        <SectionHeader
          tag="THE PARASMONI PLEDGE"
          title={title}
          subtitle={subtitle}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
          align="center"
          showLine={true}
          className="mb-8"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded border border-stone-200 p-8 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-base">
              100% BIS Hallmarked 22K (916)
            </h4>
            <p className="text-stone-500 text-xs leading-relaxed">
              Every gold asset is laser-engraved with the Bureau of Indian Standards HUID code, confirming exact, untarnished metal weight and purity.
            </p>
          </div>

          <div className="bg-white rounded border border-stone-200 p-8 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-600">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-base">
              IGI Certified Diamonds & Solitaires
            </h4>
            <p className="text-stone-500 text-xs leading-relaxed">
              Our diamond selections come backed by certificates from the International Gemological Institute, verifying clarity, color, cut, and carat.
            </p>
          </div>

          <div className="bg-white rounded border border-stone-200 p-8 space-y-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-600">
              <Scale className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-base">
              Live Bullion-Linked Valuation
            </h4>
            <p className="text-stone-500 text-xs leading-relaxed">
              We charge strictly on live market bullion rates, providing fully itemized estimates with clear separating columns for metal and making charges.
            </p>
          </div>
        </div>
      </section>
    );
  };

  const renderOurBoutiques = (content: any = {}) => {
    const title = content.title !== undefined ? content.title : 'Experience the Craftsmanship In Person';
    const subtitle = content.subtitle !== undefined ? content.subtitle : 'Step into our physical galleries to inspect the intricate weight, lustre, and detail of our traditional jewellery.';
    const eyebrowLabel = content.eyebrow !== undefined ? content.eyebrow : 'PHYSICAL SHOWROOM';
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    const displayStores = (content.selectedIds && Array.isArray(content.selectedIds) && content.selectedIds.length > 0)
      ? stores.filter(st => content.selectedIds.includes(st.id))
      : stores;

    // Boundary check for current index
    const activeIdx = currentStoreIdx >= displayStores.length ? 0 : currentStoreIdx;
    const store = displayStores[activeIdx];

    const nextSlide = () => {
      setCurrentStoreIdx((prev) => (prev + 1) % displayStores.length);
    };
    const prevSlide = () => {
      setCurrentStoreIdx((prev) => (prev - 1 + displayStores.length) % displayStores.length);
    };

    // Touch handlers for swipe support
    const handleTouchStart = (e: React.TouchEvent) => {
      storeTouchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      storeTouchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (storeTouchStartX.current === null || storeTouchEndX.current === null) return;
      const diff = storeTouchStartX.current - storeTouchEndX.current;
      if (diff > 50) {
        nextSlide();
      } else if (diff < -50) {
        prevSlide();
      }
      storeTouchStartX.current = null;
      storeTouchEndX.current = null;
    };

    // Conditional visibility filters
    const showEyebrow = eyebrowLabel && eyebrowLabel.trim() !== '';
    const showTitle = title && title.trim() !== '';
    const showSubtitle = subtitle && subtitle.trim() !== '';
    const showHeader = showEyebrow || showTitle || showSubtitle;

    // Dynamic Button styles mapped from storefront admin selections
    const appointmentBtnText = content.appointmentBtnText || 'BOOK APPOINTMENT';
    const appointmentBtnBg = content.appointmentBtnBg || '#059669';
    const appointmentBtnColor = content.appointmentBtnColor || '#ffffff';
    const appointmentBtnFontFamily = content.appointmentBtnFont === 'serif'
      ? "'Playfair Display', Georgia, serif"
      : "'Inter', 'Plus Jakarta Sans', sans-serif";

    const mapsBtnText = content.mapsBtnText || 'GOOGLE MAPS';
    const mapsBtnBg = content.mapsBtnBg || 'transparent';
    const mapsBtnColor = content.mapsBtnColor || '#ffffff';
    const mapsBtnFontFamily = content.mapsBtnFont === 'serif'
      ? "'Playfair Display', Georgia, serif"
      : "'Inter', 'Plus Jakarta Sans', sans-serif";

    const appointmentStyle = {
      backgroundColor: appointmentBtnBg,
      color: appointmentBtnColor,
      fontFamily: appointmentBtnFontFamily,
      borderColor: appointmentBtnBg,
    };

    const mapsStyle = {
      backgroundColor: mapsBtnBg,
      color: mapsBtnColor,
      fontFamily: mapsBtnFontFamily,
      borderColor: content.mapsBtnBg ? content.mapsBtnBg : 'rgba(255, 255, 255, 0.2)',
    };

    return (
      <section className="bg-stone-100 pt-12 md:pt-16 pb-0 animate-fade-in w-full overflow-hidden" id="our-stores-showcase">
        {/* Header (Conditional rendering with no empty gap) */}
        {showHeader && (
        <SectionHeader
          tag={showEyebrow ? eyebrowLabel : undefined}
          title={showTitle ? title : undefined}
          subtitle={showSubtitle ? subtitle : undefined}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
          align="center"
          showLine={true}
          className="px-4 md:px-8 xl:px-12 mb-8 md:mb-12"
        />
        )}

        {loadingStores ? (
          <div className="w-full relative h-[380px] md:h-[460px] bg-stone-950 animate-pulse"></div>
        ) : displayStores.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-12 pb-12">
            <div className="text-center py-12 bg-white border border-stone-200 rounded-3xl" id="stores-empty-state">
              <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
              <p className="text-stone-600 text-xs font-medium">No active retail locations registered.</p>
            </div>
          </div>
        ) : (
          <div 
            className="relative w-full overflow-hidden bg-black border-t border-stone-800 flex flex-col md:flex-row min-h-[400px] md:min-h-[460px] shadow-2xl select-none"
            onMouseEnter={() => setIsBoutiqueInteracting(true)}
            onMouseLeave={() => setIsBoutiqueInteracting(false)}
            onTouchStart={(e) => {
              setIsBoutiqueInteracting(true);
              handleTouchStart(e);
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => {
              setIsBoutiqueInteracting(false);
              handleTouchEnd();
            }}
          >
              {/* Photo Column / Left Portion */}
              <div className="relative w-full md:w-[60%] h-[200px] md:h-auto min-h-[200px] md:min-h-[420px] overflow-hidden bg-stone-900 shrink-0">
                <img 
                  src={getOptimizedShowroomUrl(store.imageUrl) || store.imageUrl || "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=1200"} 
                  alt={store.name} 
                  className="w-full h-full object-cover pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                
                {/* Desktop Left-to-Right Blend Gradient */}
                <div className="hidden md:block absolute inset-y-0 right-0 w-48 bg-gradient-to-r from-transparent to-black pointer-events-none" />
                
                {/* Mobile Bottom-to-Top Blend Gradient */}
                <div className="block md:hidden absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>

              {/* Black Panel / Right Portion */}
              <div className="w-full md:w-[40%] bg-black p-5 md:p-8 flex flex-col justify-center text-left space-y-5 relative z-10">
                <div className="space-y-3.5">
                  <div>
                    {showEyebrow && (
                      <span className="text-[9px] text-gold-400 font-bold tracking-widest uppercase block mb-1">
                        {eyebrowLabel}
                      </span>
                    )}
                    <h3 className="font-serif font-bold text-white text-base md:text-lg leading-snug tracking-wide uppercase">
                      {store.name}
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs text-stone-300">
                    <div className="flex gap-2.5 items-start">
                      <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-sans">{store.address}</span>
                    </div>
                    <div className="flex gap-2.5 items-center">
                      <Clock className="w-4 h-4 text-gold-500 shrink-0" />
                      <span className="font-sans text-stone-300">
                        {store.openingTime && store.closingTime
                          ? `${store.openingTime} - ${store.closingTime} (Off: ${store.weeklyOff || 'None'})`
                          : (store.hours || '09:00 AM - 08:00 PM (Off: None)')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons with Admin Customized Styling */}
                <div className="pt-1 flex flex-col sm:flex-row gap-3 w-full">
                  {/* BOOK APPOINTMENT Button */}
                  <WhatsAppButton 
                    phoneNumber={store.whatsapp || mockWebsiteSettings.whatsappNumber}
                    message={`Hello Parasmoni Jewellers, I would like to book an appointment to visit your ${store.name} showroom. Please let me know available timings.`}
                    className="font-bold text-[10px] tracking-wider uppercase h-10 px-5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-1 text-center border transition-all duration-150 hover:opacity-90"
                    label={appointmentBtnText}
                    style={appointmentStyle}
                  />

                  {/* GOOGLE MAPS Button */}
                  <a
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border text-[10px] font-bold tracking-wider uppercase h-10 px-5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 flex-1 text-center cursor-pointer hover:bg-white/5"
                    style={mapsStyle}
                  >
                    <span>{mapsBtnText}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>
              </div>

              {/* Slide Navigation Controls */}
              {displayStores.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      prevSlide();
                    }}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 items-center justify-center text-white backdrop-blur-xs transition-all cursor-pointer z-20 hover:scale-105"
                    aria-label="Previous Store"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      nextSlide();
                    }}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 items-center justify-center text-white backdrop-blur-xs transition-all cursor-pointer z-20 hover:scale-105"
                    aria-label="Next Store"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}
      </section>
    );
  };

  const renderSplitMediaBanner = (content: any = {}) => {
    const title = content.title || 'Sovereign Heavy Filigree Collection';
    const subtitle = content.subtitle || 'EXCLUSIVE ARTISTRY';
    const description = content.description || 'Discover hand-finished heavy bridal chokers, necklaces, and bangles forged by award-winning goldsmiths. Every item represents untarnished 22K purity.';
    const mediaUrl = content.mediaUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600';
    const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.mov') || mediaUrl.toLowerCase().endsWith('.webm');
    
    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#d97706', 'sans');
    const descStyle = getTextStyle(content.descriptionStyle, '#78716c', 'sans');

    const alignRight = content.alignMedia !== 'left';
    
    const pBtnStyle = content.primaryButton?.styleType === 'outlined'
      ? "border border-brand-red-600 text-brand-red-600 hover:bg-brand-red-50"
      : "bg-brand-red-600 hover:bg-brand-red-700 text-white shadow-md hover:scale-[1.02]";

    const sBtnStyle = content.secondaryButton?.styleType === 'outlined'
      ? "border border-stone-400 text-stone-700 hover:bg-stone-50"
      : "bg-stone-900 hover:bg-stone-800 text-white shadow-md hover:scale-[1.02]";

    return (
      <section className="py-12 lg:py-20 px-4 md:px-8 xl:px-12 w-full" id="split-media-banner-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className={`lg:col-span-6 space-y-6 order-2 ${alignRight ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="space-y-3">
              {subtitle && (
                <span className="text-gold-600 text-xs font-bold tracking-widest uppercase block" style={subtitleStyle}>
                  {subtitle}
                </span>
              )}
              <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
                {title}
              </h2>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed" style={descStyle}>
              {description}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              {content.primaryButton?.label && (
                <Link
                  to={content.primaryButton.linkUrl || '/catalog'}
                  className={`h-10 px-6 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center cursor-pointer ${pBtnStyle}`}
                  style={getButtonStyle(content.primaryButton, 'filled')}
                >
                  {content.primaryButton.label}
                </Link>
              )}
              {content.secondaryButton?.label && (
                <Link
                  to={content.secondaryButton.linkUrl || '/catalog'}
                  className={`h-10 px-6 text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded flex items-center justify-center cursor-pointer ${sBtnStyle}`}
                  style={getButtonStyle(content.secondaryButton, 'outlined')}
                >
                  {content.secondaryButton.label}
                </Link>
              )}
            </div>
          </div>
          
          <div className={`lg:col-span-6 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-stone-200/80 bg-stone-950 order-1 ${alignRight ? 'lg:order-2' : 'lg:order-1'}`}>
            {isVideo ? (
              <video src={getOptimizedShowroomUrl(mediaUrl) || mediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <img src={getOptimizedShowroomUrl(mediaUrl) || mediaUrl} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderInfiniteMarquee = (content: any = {}) => {
    const text = content.text || 'BIS 22K HALLMARKED • HANDCRAFTED HERITAGE • HEAVY FILIGREE DESIGNERS • CERTIFIED SOLITAIRES';
    const bgColor = content.bgColor || '#0c0a09';
    const textColor = content.textColor || '#d97706';
    
    return (
      <div className="py-4 overflow-hidden border-y border-gold-500/30 whitespace-nowrap flex relative" style={{ backgroundColor: bgColor }} id="infinite-marquee-section">
        <style>{`
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .animate-marquee-custom {
            display: flex;
            width: max-content;
            animation: marquee 25s linear infinite;
          }
        `}</style>
        <div className="animate-marquee-custom flex gap-8 text-xs tracking-widest font-bold uppercase" style={{ color: textColor }}>
          {Array(6).fill(text).map((txt, i) => (
            <span key={i} className="mx-4 block flex-shrink-0">{txt}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderMediaSlider = (content: any = {}) => {
    const mediaUrls = (content.mediaUrls && Array.isArray(content.mediaUrls) && content.mediaUrls.length > 0)
      ? content.mediaUrls
      : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'];
      
    const virtualBanners = mediaUrls.map((url: string, index: number) => ({
      id: `media-slide-${index}`,
      title: index === 0 ? (content.title || '') : '',
      subtitle: index === 0 ? (content.subtitle || '') : '',
      image: url,
      buttonText: index === 0 ? (content.primaryButton?.label || '') : '',
      buttonLink: index === 0 ? (content.primaryButton?.linkUrl || '') : '',
    }));
    
    return <BannerSlider banners={virtualBanners} />;
  };

  const renderShopTheLook = (content: any = {}) => {
    const title = content.title;
    const titleColor = content.titleColor || '#1c1917';
    const images = Array.isArray(content.images) ? content.images : [];

    if (images.length === 0) return null;

    const titleStyle = getTextStyle(content.titleStyle, titleColor, 'serif');

    return (
      <section className="py-16 px-4 sm:px-6 bg-stone-50 overflow-hidden w-full max-w-full" id="shop-the-look-section">
        <div className="max-w-7xl mx-auto space-y-8">
          <SectionHeader
            title={title}
            titleStyle={titleStyle}
            align="center"
            showLine={true}
            className="mb-8"
          />

          {/* Scrolling horizontal container (drag on desktop, swipe on mobile) */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
            {images.map((item: any, idx: number) => {
              const url = getOptimizedShowroomUrl(item.url) || item.url;
              const link = item.linkUrl || '#';
              return (
                <Link
                  key={idx}
                  to={link}
                  className="flex-shrink-0 w-[240px] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] relative aspect-[3/4.5] rounded-2xl overflow-hidden group shadow-md border border-stone-200/60 bg-stone-100 snap-start transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <img
                    src={url}
                    alt={`Look ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Elegant Bottom Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] text-amber-300 font-bold tracking-widest uppercase">
                      SHOP THE LOOK
                    </span>
                    <span className="text-xs text-white font-medium">
                      View details →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderPromoCalloutCard = (content: any = {}) => {
    const heading = content.heading || "We've got you a birthday surprise!";
    const subtitle = content.subtitle || "Add your birthday & unlock a coupon!";
    const image = content.image;
    const bgImage = content.bgImage;
    const buttonLabel = content.buttonLabel || "Unlock Surprise";
    const buttonLink = content.buttonLink || "/contact";
    const textColor = content.textColor || '#1c1917';
    const bgColor = content.bgColor || '#FAF7F2';

    // Check if bgColor is a gradient CSS string or hex color
    const isGradient = bgColor.includes('gradient') || bgColor.includes('linear') || bgColor.includes('rgba');
    const containerStyle: React.CSSProperties = {
      background: isGradient ? bgColor : undefined,
      backgroundColor: !isGradient ? bgColor : undefined,
      color: textColor,
      backgroundImage: bgImage ? `url(${getOptimizedShowroomUrl(bgImage) || bgImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };

    const titleStyleComputed = getTextStyle(content.headingStyle, textColor, 'serif');
    const subtitleStyleComputed = getTextStyle(content.subtitleStyle, textColor, 'sans');
    const buttonStyleComputed = getButtonStyle(content.buttonStyle, 'filled') || {};

    // Apply default button styling fallbacks if they aren't explicitly customized
    if (!buttonStyleComputed.backgroundColor) {
      buttonStyleComputed.backgroundColor = '#d97706';
    }
    if (!buttonStyleComputed.color) {
      buttonStyleComputed.color = '#ffffff';
    }
    if (!buttonStyleComputed.fontFamily) {
      buttonStyleComputed.fontFamily = "'Inter', 'Plus Jakarta Sans', sans-serif";
    }
    if (!buttonStyleComputed.fontSize) {
      buttonStyleComputed.fontSize = '12px';
    }

    return (
      <section className="w-full relative overflow-hidden bg-stone-50" id="promo-callout-section">
        <div
          style={containerStyle}
          className="w-full py-5 md:py-6 px-6 sm:px-12 md:px-16 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden"
        >
          {/* Background image overlay tint if bgImage and bgColor are set */}
          {bgImage && (
            <div className="absolute inset-0 bg-black/5 pointer-events-none z-0" />
          )}
          {bgImage && bgColor && (
            <div 
              className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-15" 
              style={{ 
                background: isGradient ? bgColor : bgColor 
              }}
            />
          )}

          {/* Background decorative patterns (subtle, with lower z-index) */}
          <div className="absolute top-2 left-6 w-2 h-2 rounded-full bg-amber-500/10 z-0"></div>
          <div className="absolute bottom-6 left-12 w-3 h-3 rounded-full bg-amber-500/20 z-0"></div>
          <div className="absolute top-6 right-1/4 w-1.5 h-1.5 rounded-full bg-stone-500/10 z-0"></div>

          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 text-center md:text-left z-10 w-full">
            <div className="space-y-1.5 flex-1">
              <h3 className="font-serif text-lg md:text-xl font-bold tracking-wide" style={titleStyleComputed}>
                {heading}
              </h3>
              <p className="text-xs font-medium opacity-85 max-w-xl font-sans" style={subtitleStyleComputed}>
                {subtitle}
              </p>
            </div>
            {buttonLabel && (
              <div className="shrink-0 flex justify-center md:justify-end">
                <Link
                  to={buttonLink}
                  style={buttonStyleComputed}
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-2 bg-amber-600 hover:opacity-90 text-white text-xs font-bold rounded-full transition-all duration-200 shadow-xs"
                >
                  {buttonLabel}
                  <span className="text-[10px]">▶</span>
                </Link>
              </div>
            )}
          </div>

          {image && (
            <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center relative select-none z-10">
              <img
                src={getOptimizedShowroomUrl(image) || image}
                alt="Promotion icon"
                className="w-full h-full object-contain filter drop-shadow-sm animate-bounce-slow"
                referrerPolicy="no-referrer"
                style={{ animationDuration: '3.s' }}
              />
            </div>
          )}
        </div>
      </section>
    );
  };

  const CouponCardHelper = ({ offer, hasBg }: { offer: any; hasBg: boolean; key?: any }) => {
    const labelText = offer.label !== undefined ? offer.label : 'SHOWROOM EXCLUSIVE';
    const labelStyle = getTextStyle(offer.labelStyle, hasBg ? '#78716c' : '#6b7280', 'sans');
    const discountStyle = getTextStyle(offer.discountStyle, '#d97706', 'serif');
    const promoStyle = getTextStyle(offer.promoStyle, '#1c1917', 'sans');
    const termsStyle = getTextStyle(offer.termsStyle, hasBg ? '#78716c' : '#6b7280', 'sans');
    const strokeColor = hasBg ? 'rgba(217, 119, 6, 0.4)' : '#e2e0df';

    return (
      <Link 
        to={offer.linkUrl || '#'}
        className="relative flex flex-col justify-between items-center text-center group cursor-pointer transition-all duration-300 min-h-[190px] p-6"
        style={{
          clipPath: 'url(#ticket-clip)',
          WebkitClipPath: 'url(#ticket-clip)'
        }}
      >
        {/* Ticket Shape Background with Glassmorphism */}
        <div 
          className={`absolute inset-0 transition-all duration-305 group-hover:scale-[1.02] -z-10 ${
            hasBg 
              ? 'bg-white/75 backdrop-blur-md' 
              : 'bg-white'
          }`}
          style={{
            clipPath: 'url(#ticket-clip)',
            WebkitClipPath: 'url(#ticket-clip)'
          }}
        />

        {/* Ticket Dashed Border Outline */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path 
            d="M 6,0 L 94,0 A 6 10 0 0 1 100 10 L 100,42 A 4 8 0 0 0 100 58 L 100,90 A 6 10 0 0 1 94 100 L 6,100 A 6 10 0 0 1 0 90 L 0,58 A 4 8 0 0 0 0 42 L 0,10 A 6 10 0 0 1 6 0 Z" 
            fill="none" 
            stroke={strokeColor} 
            strokeDasharray="3 3" 
            strokeWidth="1.5" 
            vectorEffect="non-scaling-stroke" 
          />
        </svg>

        <div className="space-y-1 w-full relative z-10">
          <span 
            className="text-[9px] font-sans tracking-widest block uppercase font-bold group-hover:text-amber-600 transition-colors"
            style={labelStyle}
          >
            {labelText}
          </span>
          <div className="h-[1px] w-8 bg-stone-300/30 mx-auto my-1"></div>
          <span 
            className="text-3xl font-serif font-black block leading-tight tracking-tight mt-1"
            style={discountStyle}
          >
            {offer.discount || '10% OFF'}
          </span>
        </div>

        {/* Prominent Admin-Editable Free Text */}
        <div className="my-3.5 w-full py-2 px-3 bg-white/60 border border-stone-200/30 rounded-lg backdrop-blur-xs max-w-[240px] mx-auto flex items-center justify-center relative z-10">
          <span 
            className="text-xs font-bold tracking-wider uppercase leading-none truncate"
            style={promoStyle}
          >
            {offer.promoText || offer.code || 'SPECIAL BENEFIT'}
          </span>
        </div>

        <div className="relative z-10 w-full">
          {offer.terms ? (
            <span 
              className="text-[10px] font-sans tracking-wide italic leading-normal block"
              style={termsStyle}
            >
              {offer.terms}
            </span>
          ) : (
            <span 
              className="text-[9px] font-sans tracking-widest uppercase block"
              style={termsStyle}
            >
              TAP TO EXPLORE →
            </span>
          )}
        </div>
      </Link>
    );
  };

  const renderInStoreRedemptionCode = (content: any = {}) => {
    const eyebrow = content.eyebrow || 'VISIT SHOWROOM TO REDEEM';
    const title = content.title || 'Exclusive Showroom Offers';
    const description = content.description || '*Present these coupons at our physical showroom during your visit to redeem.';
    const titleColor = content.titleColor || '#1c1917';
    const offers = Array.isArray(content.offers) ? content.offers : [];
    const hasBg = !!(content.bgImage || content.bgVideo);

    const eyebrowStyle = getTextStyle(content.eyebrowStyle, hasBg ? '#fbbf24' : '#d97706', 'sans');
    const titleStyle = getTextStyle(content.titleStyle, hasBg ? '#ffffff' : titleColor, 'serif');
    const descStyle = getTextStyle(content.descriptionStyle, hasBg ? '#e2e0df' : '#4b5563', 'sans');
    const disclaimerStyle = getTextStyle(content.disclaimerStyle, hasBg ? '#e2e0df' : '#4b5563', 'sans');

    const disclaimerText = content.disclaimer !== undefined ? content.disclaimer : '💡 In-Store Notice: These offers are valid only for transactions completed in our physical showroom. We do not support online checkouts or direct digital shipping.';

    // Resolve Mobile Card Image with desktop background fallback, then default photography
    const mobilePhoto = content.mobileCardImage || content.bgImage || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600';

    return (
      <section 
        className={`py-8 md:py-16 px-4 sm:px-6 relative overflow-hidden transition-colors duration-300 ${
          hasBg 
            ? 'bg-stone-50 md:bg-transparent text-stone-900 md:text-white' 
            : 'bg-stone-50 text-stone-900'
        }`} 
        id="in-store-offers-section"
      >
        {/* Global SVG clipPath definition */}
        <svg className="absolute w-0 h-0" width="0" height="0">
          <defs>
            <clipPath id="ticket-clip" clipPathUnits="objectBoundingBox">
              <path d="M 0.06,0 L 0.94,0 A 0.06 0.1, 0, 0, 1, 1 0.1 L 1,0.42 A 0.04 0.08, 0, 0, 0, 1 0.58 L 1,0.9 A 0.06 0.1, 0, 0, 1, 0.94 1 L 0.06,1 A 0.06 0.1, 0, 0, 1, 0 0.9 L 0,0.58 A 0.04 0.08, 0, 0, 0, 0 0.42 L 0,0.1 A 0.06 0.1, 0, 0, 1, 0.06 0 Z" />
            </clipPath>
          </defs>
        </svg>

        {/* Background media - Desktop Only */}
        {hasBg && (
          <div className="hidden md:block absolute inset-0">
            {content.bgVideo ? (
              <video 
                src={content.bgVideo} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
              />
            ) : content.bgImage ? (
              <img 
                src={content.bgImage} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
                referrerPolicy="no-referrer"
              />
            ) : null}
            {/* Overlay */}
            <div className="absolute inset-0 bg-stone-950/50 z-10 backdrop-blur-[1px]"></div>
          </div>
        )}

        {/* DESKTOP VIEW: Balanced spacing, centered coupons */}
        <div className="hidden md:block max-w-5xl mx-auto space-y-8 relative z-20">
          <div className="text-center space-y-2">
            {eyebrow && (
              <span 
                className="text-[10px] font-bold uppercase tracking-widest block"
                style={eyebrowStyle}
              >
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide" style={titleStyle}>
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs font-medium max-w-xl mx-auto" style={descStyle}>
                {description}
              </p>
            )}
            <div className="h-0.5 w-12 bg-amber-500 mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {offers.map((offer: any, idx: number) => (
              <CouponCardHelper key={offer.id || idx} offer={offer} hasBg={hasBg} />
            ))}
          </div>

          {disclaimerText && (
            <div 
              className={`text-center p-4 rounded-xl max-w-md mx-auto text-[10px] font-medium border transition-all ${
                hasBg 
                  ? 'bg-stone-950/80 border-white/10 backdrop-blur-md shadow-lg' 
                  : 'bg-stone-100 border-stone-200 text-stone-600'
              }`}
              style={disclaimerStyle}
            >
              {disclaimerText}
            </div>
          )}
        </div>

        {/* MOBILE VIEW: Consolidated Single-Card Layout matching Image 2 */}
        <div className="block md:hidden max-w-sm mx-auto relative z-20">
          <div className="bg-[#FAF7F2] rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden flex flex-col">
            {/* Top Photo */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <img 
                src={getOptimizedShowroomUrl(mobilePhoto) || mobilePhoto} 
                alt="Showroom Special" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Elegant Yellow Tag top-left corner */}
              <div className="absolute top-4 left-4 bg-amber-500 text-stone-950 font-sans text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-r-md rounded-tl-md shadow-sm">
                {eyebrow || 'NEW LAUNCH'}
              </div>
            </div>

            {/* Bottom Content Area with warm gold/beige gradient */}
            <div className="p-6 bg-gradient-to-b from-[#fbfaf7] to-[#f4f0e6] flex flex-col items-center text-center space-y-4">
              <div className="space-y-1.5 w-full">
                {/* Thin line subtitle */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-4 bg-stone-300"></div>
                  <span className="text-[9px] font-sans tracking-widest font-black uppercase text-amber-700">
                    {eyebrow || 'PARASMONI EXCLUSIVE'}
                  </span>
                  <div className="h-[1px] w-4 bg-stone-300"></div>
                </div>

                <h3 className="font-serif text-xl font-bold tracking-wide text-stone-900">
                  {title}
                </h3>
                
                <p className="font-sans text-xs font-semibold text-stone-600">
                  {description}
                </p>
              </div>

              {/* White bottom box containing the offers side-by-side */}
              {offers.length > 0 && (
                <div className="w-full bg-white/95 border border-stone-200/65 rounded-2xl p-4 shadow-xs backdrop-blur-xs flex items-center justify-center gap-4">
                  {offers.map((offer: any, idx: number) => {
                    const discountStyleLocal = getTextStyle(offer.discountStyle, '#d97706', 'serif');
                    const promoStyleLocal = getTextStyle(offer.promoStyle, '#1c1917', 'sans');
                    const linkUrl = offer.linkUrl || '#';
                    return (
                      <React.Fragment key={offer.id || idx}>
                        {idx > 0 && <div className="h-10 w-[1px] bg-stone-200 shrink-0"></div>}
                        <Link 
                          to={linkUrl}
                          className="flex-1 text-center space-y-1 group hover:scale-[1.01] transition-transform"
                        >
                          <span 
                            className="text-lg font-serif font-black block leading-none text-amber-600"
                            style={{ ...discountStyleLocal, fontSize: undefined }}
                          >
                            {offer.discount || '10% OFF'}
                          </span>
                          <span 
                            className="text-[9px] font-sans font-extrabold tracking-wider uppercase text-stone-700 block max-w-full truncate px-1"
                            style={{ ...promoStyleLocal, fontSize: undefined }}
                          >
                            {offer.promoText || offer.code || 'SPECIAL'}
                          </span>
                        </Link>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {/* T&C Fine Print */}
              <div className="w-full flex justify-end text-[9px] font-sans font-bold tracking-wider text-stone-400 uppercase">
                {offers[0]?.terms ? offers[0].terms : '*T&C Apply'}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderOGOfferCollection = (content: any = {}) => {
    const title = content.title || '';
    const subtitle = content.subtitle || '';
    const subtitleAccent = content.subtitleAccent || '';
    const subtitleAccentColor = content.subtitleAccentColor || '';

    const titleStyle = getTextStyle(content.titleStyle, '#1c1917', 'serif');
    const subtitleStyle = getTextStyle(content.subtitleStyle, '#78716c', 'sans');

    const showHeader = title.trim() !== '' || subtitle.trim() !== '';

    // Tiles default configuration if not uploaded yet
    const tile1 = content.tile1 || {
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
      linkUrl: "#"
    };
    const tile2 = content.tile2 || {
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400",
      linkUrl: "#"
    };
    const tile3 = content.tile3 || {
      image: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=400",
      linkUrl: "#"
    };

    const renderSubtitleWithAccent = (text: string, accent?: string, accentColor?: string) => {
      if (!text) return null;
      if (!accent) return <span>{text}</span>;

      const index = text.toLowerCase().indexOf(accent.toLowerCase());
      if (index === -1) return <span>{text}</span>;

      const before = text.substring(0, index);
      const matched = text.substring(index, index + accent.length);
      const after = text.substring(index + accent.length);

      return (
        <span>
          {before}
          <span style={accentColor ? { color: accentColor } : { color: '#be123c' }} className="font-semibold">
            {matched}
          </span>
          {after}
        </span>
      );
    };

    return (
      <section className="py-6 md:py-8 bg-white text-stone-900 w-full" id={`og-offer-section-${content.id || 'default'}`}>
        <div className="w-full px-4 md:px-8 xl:px-12 space-y-5 md:space-y-6">
          
          {/* Centralized Section Header */}
          <SectionHeader
            title={title}
            subtitle={subtitle}
            titleStyle={titleStyle}
            subtitleStyle={subtitleStyle}
            align="center"
            showLine={false}
            className="max-w-2xl mx-auto mb-4 md:mb-6"
          />

          {/* Asymmetric 3-Tile Image Grid Layout */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-5 items-stretch h-[220px] sm:h-[320px] md:h-[450px] lg:h-[500px]">
            {/* Tile 1: Left Large Tile */}
            <div className="w-full h-full min-h-0 min-w-0">
              {tile1.image ? (
                <Link 
                  to={tile1.linkUrl || '#'} 
                  className="block relative rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group w-full h-full transition-all hover:shadow-md cursor-pointer"
                >
                  <img 
                    src={tile1.image} 
                    alt={tile1.title || "Collection Highlight 1"} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Elegant Title Overlay at the bottom */}
                  {tile1.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pt-8 pb-3 px-3 flex items-end justify-center transition-opacity duration-300">
                      <span 
                        className="text-white font-serif text-[11px] sm:text-base md:text-xl lg:text-2xl font-normal tracking-wide text-center"
                        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
                      >
                        {tile1.title}
                      </span>
                    </div>
                  )}
                </Link>
              ) : (
                <div className="w-full h-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 font-medium text-xs">
                  Upload Left Highlight Image
                </div>
              )}
            </div>

            {/* Right Stack Column (Tile 2 & Tile 3) */}
            <div className="grid grid-cols-1 grid-rows-2 gap-2 sm:gap-4 md:gap-5 h-full min-h-0 min-w-0">
              {/* Tile 2: Top Right Small Tile */}
              <div className="w-full h-full min-h-0 min-w-0">
                {tile2.image ? (
                  <Link 
                    to={tile2.linkUrl || '#'} 
                    className="block relative rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group w-full h-full transition-all hover:shadow-md cursor-pointer"
                  >
                    <img 
                      src={tile2.image} 
                      alt={tile2.title || "Collection Highlight 2"} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {/* Subtle Elegant Title Overlay at the bottom */}
                    {tile2.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pt-8 pb-3 px-3 flex items-end justify-center transition-opacity duration-300">
                        <span 
                          className="text-white font-serif text-[11px] sm:text-base md:text-xl lg:text-2xl font-normal tracking-wide text-center"
                          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
                        >
                          {tile2.title}
                        </span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 font-medium text-xs">
                    Upload Top Right Highlight Image
                  </div>
                )}
              </div>

              {/* Tile 3: Bottom Right Small Tile */}
              <div className="w-full h-full min-h-0 min-w-0">
                {tile3.image ? (
                  <Link 
                    to={tile3.linkUrl || '#'} 
                    className="block relative rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 group w-full h-full transition-all hover:shadow-md cursor-pointer"
                  >
                    <img 
                      src={tile3.image} 
                      alt={tile3.title || "Collection Highlight 3"} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {/* Subtle Elegant Title Overlay at the bottom */}
                    {tile3.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pt-8 pb-3 px-3 flex items-end justify-center transition-opacity duration-300">
                        <span 
                          className="text-white font-serif text-[11px] sm:text-base md:text-xl lg:text-2xl font-normal tracking-wide text-center"
                          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
                        >
                          {tile3.title}
                        </span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 font-medium text-xs">
                    Upload Bottom Right Highlight Image
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>
    );
  };

  const renderParagraphDocument = (content: any = {}) => {
    const title = content.title || 'About Us & Policies';
    const subtitle = content.subtitle || 'PARASMONI JEWELLERS & BROTHERS • LEGAL & INFORMATION DOCUMENTATION';
    const lastUpdated = content.lastUpdated || 'Updated September 2026';
    const sections = Array.isArray(content.sections) ? content.sections : [];
    const contactNotice = content.contactNotice || 'For inquiries, reach out to support@parasmoni.in or visit our Bowbazar showroom.';

    return (
      <section className="py-12 md:py-16 bg-stone-50/60 border-y border-stone-200/60 font-sans" id="section-paragraph-document">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-10 md:p-14 space-y-8">
            
            {/* Top Header Badge & Meta */}
            <div className="border-b border-stone-200 pb-8 space-y-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700 bg-amber-50 border border-amber-200/70 px-3 py-1 rounded-full font-mono">
                  {subtitle}
                </span>
                <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {lastUpdated}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight pt-2">
                {title}
              </h1>
            </div>

            {/* Quick Section Index Bar */}
            {sections.length > 0 && (
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mr-2 font-mono">
                  Document Index:
                </span>
                {sections.map((sec: any, idx: number) => (
                  <a
                    key={idx}
                    href={`#doc-sec-${idx}`}
                    className="text-xs font-semibold text-stone-700 hover:text-amber-700 bg-white border border-stone-200/70 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-all shadow-2xs hover:shadow-xs"
                  >
                    {sec.heading || `Section ${idx + 1}`}
                  </a>
                ))}
              </div>
            )}

            {/* Document Sections */}
            <div className="space-y-10 pt-2">
              {sections.map((sec: any, idx: number) => (
                <div key={idx} id={`doc-sec-${idx}`} className="space-y-4 scroll-mt-24 border-b border-stone-100 pb-8 last:border-0 last:pb-0">
                  {sec.heading && (
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                      <span>{sec.heading}</span>
                    </h2>
                  )}

                  {/* Paragraphs */}
                  {Array.isArray(sec.paragraphs) && sec.paragraphs.map((pText: string, pIdx: number) => (
                    <p key={pIdx} className="text-stone-700 text-sm sm:text-base leading-relaxed font-sans">
                      {pText}
                    </p>
                  ))}

                  {/* Bullet points */}
                  {Array.isArray(sec.bulletPoints) && sec.bulletPoints.length > 0 && (
                    <ul className="space-y-2.5 pt-2 pl-1">
                      {sec.bulletPoints.map((bText: string, bIdx: number) => (
                        <li key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm text-stone-700">
                          <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 bg-amber-50 rounded-full p-0.5 border border-amber-200" />
                          <span>{bText}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Contact / Grievance Notice Card */}
            {contactNotice && (
              <div className="mt-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono block">
                    Grievance & Verification Office
                  </span>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                    {contactNotice}
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shrink-0 shadow-sm cursor-pointer"
                >
                  <span>Inquire Showroom</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

          </div>
        </div>
      </section>
    );
  };

  const renderBlogArticle = (content: any = {}) => {
    const title = content.title || 'Master Bengali Craftsman Journal';
    const subtitle = content.subtitle || 'PARASMONI HERITAGE JOURNAL • GOLDSMITH CHRONICLES';
    const authorName = content.authorName || 'Parasmoni Master Craftsman';
    const authorRole = content.authorRole || 'Chief Goldsmith & Artisan';
    const authorAvatar = content.authorAvatar || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=200';
    const publishDate = content.publishDate || 'September 2026';
    const readTime = content.readTime || '5 min read';
    const coverImage = content.coverImage || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200';
    const excerpt = content.excerpt || 'Exploring traditional goldsmithing techniques from Kolkata’s historic Bowbazar lanes.';
    const blocks = Array.isArray(content.blocks) ? content.blocks : [];

    return (
      <article className="py-12 md:py-16 bg-stone-50/50 border-y border-stone-200/60 font-sans" id="section-blog-article">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Article Header & Title */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700 bg-amber-50 border border-amber-200/70 px-3 py-1 rounded-full font-mono inline-block">
                {subtitle}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
                {title}
              </h1>
              {excerpt && (
                <p className="font-serif italic text-base sm:text-lg text-stone-600 leading-relaxed max-w-4xl pt-1">
                  "{excerpt}"
                </p>
              )}
            </div>

            {/* Author Meta Bar */}
            <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/30 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="block text-xs font-bold text-stone-900 uppercase tracking-wide">
                    {authorName}
                  </span>
                  <span className="block text-[10px] text-amber-800 font-mono">
                    {authorRole}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-500 font-mono">
                <span>{publishDate}</span>
                <span>•</span>
                <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {readTime}
                </span>
              </div>
            </div>

            {/* Full HD Cover Image */}
            {coverImage && (
              <div className="relative rounded-xl overflow-hidden border border-stone-200 shadow-sm max-h-[520px]">
                <img
                  src={coverImage}
                  alt={title}
                  className="w-full h-full object-cover max-h-[520px]"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Content Blocks Reader */}
            <div className="space-y-8 pt-4 max-w-4xl mx-auto">
              {blocks.map((blk: any, bIdx: number) => {
                if (blk.type === 'paragraph') {
                  return (
                    <div key={bIdx} className="space-y-2">
                      {blk.heading && (
                        <h2 className="font-serif text-2xl font-bold text-stone-900 pt-2">
                          {blk.heading}
                        </h2>
                      )}
                      <p className="text-stone-700 text-base leading-relaxed font-sans">
                        {blk.text}
                      </p>
                    </div>
                  );
                }

                if (blk.type === 'quote') {
                  return (
                    <blockquote key={bIdx} className="border-l-4 border-amber-600 pl-6 py-4 my-6 bg-amber-500/5 rounded-r-xl font-serif italic text-lg sm:text-xl text-stone-900 shadow-2xs">
                      "{blk.text}"
                    </blockquote>
                  );
                }

                if (blk.type === 'image_paragraph') {
                  return (
                    <div key={bIdx} className="space-y-4 my-6">
                      {blk.heading && (
                        <h2 className="font-serif text-2xl font-bold text-stone-900">
                          {blk.heading}
                        </h2>
                      )}
                      {blk.imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-stone-200 shadow-2xs">
                          <img
                            src={blk.imageUrl}
                            alt={blk.caption || blk.heading || 'Article figure'}
                            className="w-full h-auto max-h-[420px] object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {blk.caption && (
                            <p className="text-[11px] text-stone-500 font-mono text-center p-2.5 bg-stone-50 border-t border-stone-100">
                              {blk.caption}
                            </p>
                          )}
                        </div>
                      )}
                      {blk.text && (
                        <p className="text-stone-700 text-base leading-relaxed font-sans">
                          {blk.text}
                        </p>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {/* Bottom Article Actions */}
            <div className="pt-8 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
                  Parasmoni Heritage Collections
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </article>
    );
  };

  const renderInquiriesCommissionsSection = (content: any = {}) => {
    const tag = content.tag || 'INQUIRIES & COMMISSIONS';
    const title = content.title || 'Commission a Custom Legacy Piece';
    const subtitle = content.subtitle || 'Have a specific weight, profile, or design layout in mind? Connect directly with our showroom team on phone or WhatsApp. We build bespoke masterpieces customized to your budget.';
    const openHours = content.openHours || 'Open Mon - Sat';
    const location = content.location || 'Kolkata Bowbazar & Gariahat';

    return (
      <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto text-center space-y-8" id="contact-cta-section">
        <SectionHeader
          tag={tag}
          title={title}
          subtitle={subtitle}
          tagStyle={{ color: '#be123c' }}
          align="center"
          showLine={true}
          className="mb-8"
        />

        <div className="max-w-md mx-auto pt-2">
          <ContactButtons 
            phoneNumber={mockWebsiteSettings.contactNumber}
            whatsappNumber={mockWebsiteSettings.whatsappNumber}
            whatsappMessage={mockWebsiteSettings.whatsappMessage}
          />
        </div>

        <div className="flex justify-center gap-6 text-stone-400 text-[11px] font-medium font-sans">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gold-500" />
            <span>{openHours}</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gold-500" />
            <span>{location}</span>
          </span>
        </div>
      </section>
    );
  };

  const renderSectionContent = (type: string, content?: any) => {
    switch (type) {
      case 'Hero Banner':
        return renderHeroBanner(content);
      case 'Offer Banner B1':
        return <OfferBannerB1 content={content} />;
      case 'Quick Category Strip':
        return renderQuickCategoryStrip(content);
      case 'Testimonials':
        return renderTestimonials(content);
      case 'Category Cards':
        return renderCategoryCards(content);
      case 'Shop by Collection':
      case 'Shop By Collection':
        return renderCollectionsShowcase(content);
      case 'Product Carousel':
        return renderProductCarousel(content);
      case 'About Collection':
      case 'Story Collage':
        return renderAboutCollection(content);
      case 'Why Choose Parasmoni':
        return renderWhyChooseUs(content);
      case 'Our Boutiques':
        return renderOurBoutiques(content);
      case 'Split Media Banner':
        return renderSplitMediaBanner(content);
      case 'Infinite Marquee':
        return renderInfiniteMarquee(content);
      case 'Media Slider':
        return renderMediaSlider(content);
      case 'OG Offer Collection':
        return renderOGOfferCollection(content);
      case 'Shop The Look':
        return renderShopTheLook(content);
      case 'Promo Callout Card':
        return renderPromoCalloutCard(content);
      case 'In-Store Redemption Code':
        return renderInStoreRedemptionCode(content);
      case 'Paragraph Document':
      case 'Policy Document':
      case 'Text Paragraph':
        return renderParagraphDocument(content);
      case 'Blog Article':
      case 'Article Story':
      case 'Blog Section':
        return renderBlogArticle(content);
      case 'Inquiries & Commissions':
      case 'Inquiries & Commissions CTA':
      case 'Contact CTA Segment':
        return renderInquiriesCommissionsSection(content);
      default:
        return (
          <div className="py-12 bg-stone-100 text-stone-500 text-center text-xs font-mono rounded border border-dashed border-stone-300">
            Unknown Section Type: {type}
          </div>
        );
    }
  };

  // Drag-and-drop mechanics
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...currentSections];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    if (onReorderSections) {
      onReorderSections(updated);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="bg-stone-50" id="showroom-home-landing">
      {/* Inject Live Head Meta Tags */}
      {!isBuilder && (
        <PageSEOHead 
          seo={seoData || pageSeo} 
          pageTitle="Parasmoni Jewellers & Brothers | Premium Gold Jewellery Showroom Since 1974"
        />
      )}

      {/* Informative Environment Status Banner */}
      {fallbackActive && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4" id="fallback-notification-bar">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-amber-800">
            <span className="flex items-center gap-2 font-medium">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Developer Preview Mode</strong>: Showroom is seamlessly operating on fallback cache. Firestore initialization will hook automatically upon credentials load.
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Sections Stack */}
      <div className="space-y-0" id="dynamic-sections-container">
        {currentLoadingSections ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-bold tracking-wider uppercase">Loading custom layout...</p>
          </div>
        ) : currentSections.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="font-serif font-bold text-stone-800 text-lg">Empty Storefront Canvas</h3>
            <p className="text-stone-500 text-xs">There are no active storefront sections on the canvas. Add sections via the editor panel.</p>
          </div>
        ) : (
          currentSections.map((section, index) => {
            const isDragged = draggedIndex === index;
            const isSelected = selectedSectionId === section.id;
            return (
              <div 
                key={section.id || index}
                onClick={(e) => {
                  if (isBuilder) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSectionClick && onSectionClick(section.id);
                  }
                }}
                className={`relative group/section transition-all duration-300 ${
                  isBuilder ? 'hover:ring-2 hover:ring-amber-500/50 cursor-pointer' : ''
                } ${
                  isBuilder && isSelected ? 'ring-4 ring-amber-500 bg-amber-500/5' : ''
                } ${isDragged ? 'opacity-40 scale-[0.99] ring-2 ring-amber-600 bg-stone-100' : ''}`}
                onDragOver={(e) => isBuilder && handleDragOver(e, index)}
              >
                {/* Floating control column on left edge (White pill, matching reference exactly) */}
                {isBuilder && (
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white border border-stone-200 shadow-xl rounded-full py-2.5 px-1.5 flex flex-col items-center gap-2.5 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 pointer-events-auto"
                    style={{ minWidth: '38px' }}
                  >
                    {/* Drag Handle */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      className="text-stone-400 hover:text-stone-800 p-1.5 rounded hover:bg-stone-100 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center shrink-0"
                      title="Drag to reorder"
                    >
                      <div className="grid grid-cols-2 gap-0.5 w-3 h-4 items-center justify-center">
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="w-5 h-[1px] bg-stone-100" />
                    
                    {/* Plus Icon (Adds section below) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSectionClick && onAddSectionClick(index);
                      }}
                      className="text-stone-500 hover:text-amber-600 p-1.5 rounded hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title="Insert section below"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    <div className="w-5 h-[1px] bg-stone-100" />
                    
                    {/* × Icon (Deletes section) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSectionClick && onDeleteSectionClick(index);
                      }}
                      className="text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title="Delete section"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Real rendered section content */}
                <div className={isBuilder ? 'pointer-events-none select-none' : ''}>
                  {renderSectionContent(section.type, section.content)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
