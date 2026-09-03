/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NavigationLink {
  mode: 'collection' | 'category' | 'page' | 'custom';
  value: string;
}

export interface NavigationSubItem {
  id: string;
  title: string;
  link: NavigationLink;
}

export interface NavigationMegaColumn {
  id: string;
  subtitle: string;
  image?: string;
  links: {
    id: string;
    label: string;
    link: NavigationLink;
  }[];
}

export interface NavigationItem {
  id: string;
  label: string;
  textColor?: string;
  type: 'direct' | 'dropdown' | 'mega';
  link?: NavigationLink;
  dropdownItems?: NavigationSubItem[];
  megaColumns?: NavigationMegaColumn[];
}

export interface WebsiteSettings {
  brandName: string;
  tagline: string;
  establishedYear: number;
  logoUrl: string;
  contactNumber: string;
  whatsappNumber: string;
  whatsappMessage: string;
  emailAddress: string;
  address: string;
  googleMapUrl: string;
  socials: {
    facebook: string;
    instagram: string;
    youtube: string;
    pinterest: string;
  };
  workingHours: string;
  categoryShowcaseEyebrowTag?: string;
  categoryShowcaseTitle?: string;
  categoryShowcaseSubtitle?: string;
  categoryShowcaseLayout?: 'single' | 'double';
  categoryShowcaseHeaderBgColor?: string;
  categoryShowcaseHeaderTextColor?: string;
  categoryShowcaseHeaderBorderColor?: string;
  categoryShowcaseHeaderFontStyle?: string;
  categoryShowcaseHeaderFontSize?: string;
  categoryShowcaseSubtitleColor?: string;
  categoryShowcaseEyebrowColor?: string;
  navigation?: NavigationItem[];
  navGlobalTextColor?: string;
  navGlobalFontSize?: string;
  navGlobalFontWeight?: string;
}

export const mockWebsiteSettings: WebsiteSettings = {
  brandName: "PARASMONI JEWELLERS & BROTHERS",
  tagline: "Exquisite Handcrafted Gold, Diamond, Polki, & Antique Masterpieces Since 1974",
  establishedYear: 1974,
  logoUrl: "https://ik.imagekit.io/ugm0ru2xm/Screenshot%202026-08-25%20135242.jpg?updatedAt=1787646387697",
  contactNumber: "+91 33 2241 9876",
  whatsappNumber: "+91 9876543210",
  whatsappMessage: "Hello Parasmoni Jewellers, I would like to inquire about your premium gold and diamond collections.",
  emailAddress: "info@parasmonijewellers.com",
  address: "123, Bowbazar Street, Near Lalbazar, Kolkata, West Bengal 700012, India",
  googleMapUrl: "https://maps.google.com",
  socials: {
    facebook: "https://facebook.com/parasmonijewellers",
    instagram: "https://instagram.com/parasmonijewellers",
    youtube: "https://youtube.com/parasmonijewellers",
    pinterest: "https://pinterest.com/parasmonijewellers"
  },
  workingHours: "Mon - Sat: 11:30 AM - 8:00 PM | Sun: Closed",
  categoryShowcaseEyebrowTag: "CURATED SELECTIONS",
  categoryShowcaseTitle: "Shop by Category Showcase",
  categoryShowcaseSubtitle: "Explore our spectacular hand-crafted designs categorized for perfect visual navigation",
  categoryShowcaseLayout: "single",
  categoryShowcaseHeaderBgColor: "transparent",
  categoryShowcaseHeaderTextColor: "#052e16",
  categoryShowcaseHeaderBorderColor: "transparent",
  categoryShowcaseHeaderFontStyle: "serif",
  categoryShowcaseHeaderFontSize: "28px",
  categoryShowcaseSubtitleColor: "#78716c",
  categoryShowcaseEyebrowColor: "#e11d48",
  navigation: [
    { id: 'nav-home', label: 'HOME', type: 'direct', link: { mode: 'custom', value: '/' } },
    { id: 'nav-collections', label: 'COLLECTIONS', type: 'direct', link: { mode: 'custom', value: '/catalog?focus=collections' } },
    { id: 'nav-jewellery', label: 'JEWELLERY', type: 'direct', link: { mode: 'custom', value: '/catalog' } },
    { id: 'nav-about', label: 'ABOUT US', type: 'direct', link: { mode: 'custom', value: '/catalog?focus=collections' } },
    { id: 'nav-stores', label: 'OUR STORES', type: 'direct', link: { mode: 'custom', value: '/stores' } },
    { id: 'nav-contact', label: 'CONTACT', type: 'direct', link: { mode: 'custom', value: '/contact' } },
  ],
  navGlobalTextColor: '#ffffff',
  navGlobalFontSize: '11px',
  navGlobalFontWeight: 'font-semibold'
};
