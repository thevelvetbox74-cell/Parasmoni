/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Default Footer Customization Schema & Types
 */

export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface LinkColumn {
  id: string;
  title: string;
  titleFontFamily?: string; // 'font-serif' | 'font-sans' | 'font-mono'
  titleFontSize?: string;   // 'text-xs' | 'text-sm' | 'text-base' | 'text-lg'
  titleColor?: string;
  linkFontFamily?: string;
  linkFontSize?: string;
  linkColor?: string;
  links: FooterLink[];
}

export interface ContactIcon {
  id: string;
  type: 'whatsapp' | 'email' | 'chat' | 'custom';
  label: string;
  url: string;
  useCustomIcon: boolean;
  customIconSvg?: string;
}

export interface SocialPlatform {
  id: string;
  type: 'instagram' | 'x' | 'facebook' | 'youtube' | 'pinterest' | 'custom';
  url: string;
  useCustomIcon: boolean;
  customIconSvg?: string;
}

export interface PaymentBadge {
  id: string;
  name: string;
  imageUrl: string; // custom upload URL or inline SVG
}

export interface FooterConfig {
  backgroundColor: string;
  globalFontFamily: 'font-serif' | 'font-sans' | 'font-mono';
  globalTextColor: string; // e.g. '#d6d3d1' (stone-300)
  
  // 1. App Block
  showAppBlock: boolean;
  appBlockTitle: string;
  appBlockTitleFontFamily?: 'font-serif' | 'font-sans' | 'font-mono';
  appBlockTitleFontSize?: string;
  appBlockTitleColor?: string;
  logoUrl?: string; // custom logo override, defaults to settings.logoUrl
  qrCodeUrl: string; // uploadable QR image
  playStoreBadgeUrl: string;
  playStoreLink: string;
  appStoreBadgeUrl: string;
  appStoreLink: string;

  // 2. Multi-column links
  columns: LinkColumn[];

  // 3. Contact Us Column
  contactColumn: {
    title: string;
    titleFontFamily?: 'font-serif' | 'font-sans' | 'font-mono';
    titleFontSize?: string;
    titleColor?: string;
    primaryPhone: string;
    primaryPhoneOverride: boolean;
    chatWithUsLabel: string;
    secondaryPhone: string;
    icons: ContactIcon[];
  };

  // 4. Social Row
  socialRow: {
    label: string;
    labelFontFamily?: 'font-serif' | 'font-sans' | 'font-mono';
    labelFontSize?: string;
    labelColor?: string;
    platforms: SocialPlatform[];
  };

  // 5. Payment Badges Row
  paymentBadges: PaymentBadge[];

  // 6. Copyright Row
  copyright: {
    text: string;
    autoYear: boolean;
    staticYear?: string;
    legalLinks: FooterLink[];
  };

  // Spacing Configuration
  spacing: {
    columnGap: string;      // e.g. 'gap-10 md:gap-16'
    rowSpacing: string;     // e.g. 'space-y-10 md:space-y-14'
    sectionPaddingY: string; // e.g. 'pt-16 pb-12' or 'pt-24 pb-16'
  };

  // Custom Border & Curve Options
  bottomFlat?: boolean;
  borderThickness?: number;
  borderColor?: string;
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  backgroundColor: '#2D0B0A',
  globalFontFamily: 'font-sans',
  globalTextColor: '#d6d3d1', // stone-300
  
  // App download block default values
  showAppBlock: true,
  appBlockTitle: 'Download the Parasmoni App Now',
  appBlockTitleFontFamily: 'font-serif',
  appBlockTitleFontSize: 'text-base',
  appBlockTitleColor: '#f59e0b', // amber-500/gold
  logoUrl: '', // blank defaults to original settings.logoUrl
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://parasmoni.com',
  playStoreBadgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg',
  playStoreLink: 'https://play.google.com/store',
  appStoreBadgeUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg',
  appStoreLink: 'https://apps.apple.com',

  // 2. Link lists column layout
  columns: [
    {
      id: 'useful-links',
      title: 'Useful Links',
      titleFontFamily: 'font-serif',
      titleFontSize: 'text-sm',
      titleColor: '#ffffff',
      links: [
        { id: 'ul-1', label: 'Delivery Information', url: '/catalog?focus=collections' },
        { id: 'ul-2', label: 'International Shipping', url: '/catalog?focus=collections' },
        { id: 'ul-3', label: 'Payment Options', url: '/catalog?focus=collections' },
        { id: 'ul-4', label: 'Track your Order', url: '/catalog?focus=collections' },
        { id: 'ul-5', label: 'Returns', url: '/catalog?focus=collections' },
        { id: 'ul-6', label: 'Find a Store', url: '/stores' }
      ]
    },
    {
      id: 'information',
      title: 'Information',
      titleFontFamily: 'font-serif',
      titleFontSize: 'text-sm',
      titleColor: '#ffffff',
      links: [
        { id: 'info-1', label: 'Blog', url: '/catalog?focus=collections' },
        { id: 'info-2', label: 'Offers & Contest Details', url: '/catalog?focus=collections' },
        { id: 'info-3', label: 'Help & FAQs', url: '/contact' },
        { id: 'info-4', label: 'About Parasmoni', url: '/catalog?focus=collections' },
        { id: 'info-5', label: 'Cookie Policy', url: '/catalog?focus=collections' }
      ]
    }
  ],

  // 3. Contact information column
  contactColumn: {
    title: 'Contact Us',
    titleFontFamily: 'font-serif',
    titleFontSize: 'text-sm',
    titleColor: '#ffffff',
    primaryPhone: '1800-296-6677',
    primaryPhoneOverride: false, // fallback to settings.contactNumber if false
    chatWithUsLabel: 'Chat With Us',
    secondaryPhone: '+91 8147349242',
    icons: [
      { id: 'co-1', type: 'whatsapp', label: 'WhatsApp', url: '', useCustomIcon: false },
      { id: 'co-2', type: 'email', label: 'Email', url: '', useCustomIcon: false },
      { id: 'co-3', type: 'chat', label: 'LiveChat', url: '', useCustomIcon: false }
    ]
  },

  // 4. Social row configuration
  socialRow: {
    label: 'Social',
    labelFontFamily: 'font-serif',
    labelFontSize: 'text-sm',
    labelColor: '#ffffff',
    platforms: [
      { id: 'so-1', type: 'instagram', url: 'https://instagram.com', useCustomIcon: false },
      { id: 'so-2', type: 'x', url: 'https://x.com', useCustomIcon: false },
      { id: 'so-3', type: 'facebook', url: 'https://facebook.com', useCustomIcon: false },
      { id: 'so-4', type: 'youtube', url: 'https://youtube.com', useCustomIcon: false }
    ]
  },

  // 5. Credit/Debit/Payment method trust badges
  paymentBadges: [
    { id: 'pay-1', name: 'Visa', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg' },
    { id: 'pay-2', name: 'Mastercard', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg' },
    { id: 'pay-3', name: 'American Express', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg' },
    { id: 'pay-4', name: 'PayPal', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' },
    { id: 'pay-5', name: 'Diners Club', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg' },
    { id: 'pay-6', name: 'Discover', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg' }
  ],

  // 6. Bottom row (copyright and small legal links list)
  copyright: {
    text: 'Titan Company Limited. All Rights Reserved.', // following reference style
    autoYear: true,
    staticYear: '2026',
    legalLinks: [
      { id: 'll-1', label: 'Cyber Security Policy', url: '/catalog?focus=collections' },
      { id: 'll-2', label: 'Terms & Conditions', url: '/catalog?focus=collections' },
      { id: 'll-3', label: 'Privacy Notice', url: '/catalog?focus=collections' },
      { id: 'll-4', label: 'Disclaimer', url: '/catalog?focus=collections' }
    ]
  },

  // Consistent Spacing System Tokens to fix the cramped spacing issues
  spacing: {
    columnGap: 'gap-12 md:gap-16 lg:gap-24',
    rowSpacing: 'space-y-12 md:space-y-16',
    sectionPaddingY: 'pt-24 pb-16'
  },
  bottomFlat: true,
  borderThickness: 4,
  borderColor: '#b58b37'
};
