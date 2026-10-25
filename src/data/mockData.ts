/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Banner, MetalPrice, Collection, StoreLocation } from '../components/ShowroomComponents';

export const mockMetalPrices: MetalPrice[] = [
  { metal: "Gold (22K 916)", pricePerGram: 6850, change: 0.35, unit: "1g" },
  { metal: "Gold (24K)", pricePerGram: 7470, change: 0.42, unit: "1g" },
  { metal: "Sovereign Gold (8g)", pricePerGram: 54800, change: 0.35, unit: "8g" },
  { metal: "Sterling Silver (925)", pricePerGram: 89, change: -0.15, unit: "1g" }
];

export const mockBanners: Banner[] = [
  {
    id: "banner-1",
    title: "Heritage Sovereign Bridal Gold",
    subtitle: "Purity unmatched since 1974. Explore traditional Kolkata filigree and heavy bridal chokers handcrafted by master artisans.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200",
    buttonText: "EXPLORE BRIDAL MASTERPIECES",
    buttonLink: "/jewellery?category=bridal"
  },
  {
    id: "banner-2",
    title: "IGI Certified Solitaires & Polki",
    subtitle: "Every diamond has a soul. Discover brilliant-cut solitaires and hand-set royal Polki crafted for family legacy.",
    image: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=1200",
    buttonText: "VIEW SOLITAIRE RINGS",
    buttonLink: "/jewellery?category=solitaires"
  },
  {
    id: "banner-3",
    title: "Kolkata Nakashi & Antique Bangles",
    subtitle: "A testament to Bengali goldsmith craftsmanship. Elevate your presence with heavy temple kadas and intricate nakashi work.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200",
    buttonText: "VIEW ANTIQUE CUFFS",
    buttonLink: "/jewellery?category=bangles"
  }
];

export const mockCollections: Collection[] = [
  {
    id: "col-1",
    name: "Royal Kundan & Polki",
    description: "Sovereign-grade hand-set gemstones surrounded by fine 22K gold foil, honoring royal Mughal heritage.",
    imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=600",
    slug: "kundan"
  },
  {
    id: "col-2",
    name: "Heritage Nakashi Filigree",
    description: "Intricate gold wirework and embossed deity figures hammered by legacy Kolkata artisans.",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
    slug: "heritage"
  },
  {
    id: "col-3",
    name: "IGI Certified Solitaires",
    description: "Rare, color-graded diamonds selected with optical precision for lifetime milestones.",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600",
    slug: "solitaires"
  },
  {
    id: "col-4",
    name: "Heavy Bridal Kadas",
    description: "Ornate gold bangles with internal hinges, featuring lion-head (Makar) and peacock carvings.",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600",
    slug: "bangles"
  }
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Sovereign Sita-Har Nakashi Necklace",
    sku: "PM-NH-091",
    description: "A breathtaking long Sita-Har necklace handcrafted in pure 22K gold, featuring a central Laxmi pendant, delicate chain linkages, and intricate nakashi work.",
    category: "Necklaces",
    collection: "Heritage Nakashi Filigree",
    metalType: "22K Gold",
    approxWeight: "64.20g",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
    isPopular: true
  },
  {
    id: "prod-2",
    name: "Imperial Polki Jhumka Earrings",
    sku: "PM-ER-142",
    description: "Vintage Mughal-inspired chandelier jhumkas in 22K yellow gold, meticulously set with uncut Polki diamonds, real seed pearls, and natural ruby drops.",
    category: "Earrings",
    collection: "Royal Kundan & Polki",
    metalType: "22K Gold & Polki",
    approxWeight: "32.80g",
    imageUrl: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=600",
    isPopular: true
  },
  {
    id: "prod-3",
    name: "The Parasmoni Solitaire Ring",
    sku: "PM-RG-882",
    description: "An elegant, timeless statement solitaire ring featuring a 1.50 carat D-color, VVS1-clarity round brilliant-cut diamond, secured on an 18K white gold band.",
    category: "Rings",
    collection: "IGI Certified Solitaires",
    metalType: "18K Diamond",
    approxWeight: "4.50g",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600",
    isPopular: true
  },
  {
    id: "prod-4",
    name: "Embossed Makar Mukhi Kada",
    sku: "PM-BG-304",
    description: "A traditional broad bangle featuring double Makar (mythological crocodile-lion) heads meeting at the hinge, detailed with deep nakashi embossing.",
    category: "Bangles",
    collection: "Heavy Bridal Kadas",
    metalType: "22K Gold",
    approxWeight: "48.10g",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600",
    isPopular: false
  },
  {
    id: "prod-5",
    name: "Bridal Antique Choker Set",
    sku: "PM-NH-223",
    description: "A dense, high-collar handcrafted gold choker set using antique matte-finish gold wirework, combined with matching tier-drop earrings.",
    category: "Necklaces",
    collection: "Heritage Nakashi Filigree",
    metalType: "22K Gold",
    approxWeight: "84.50g",
    imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=600",
    isPopular: true
  },
  {
    id: "prod-6",
    name: "Handcrafted Kundan Maang Tikka",
    sku: "PM-MT-012",
    description: "An exceptional bridal hair ornament set with precise kundan glass-inlay work, bordered by red enamel (meenakari) accents and dynamic pearl drops.",
    category: "Bridal Accessories",
    collection: "Royal Kundan & Polki",
    metalType: "22K Gold",
    approxWeight: "18.60g",
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600",
    isPopular: false
  }
];

export const mockStores: StoreLocation[] = [
  {
    id: "store-1",
    name: "Flagship Showroom — Bowbazar",
    address: "123, Bowbazar Street, Near Lalbazar Crossing, Kolkata, West Bengal 700012, India",
    phone: "+91 33 2241 9876",
    whatsapp: "+91 9876543210",
    hours: "Mon - Sat: 11:30 AM - 8:00 PM | Sun: Closed",
    mapUrl: "https://maps.google.com",
    imageUrl: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "store-2",
    name: "Heritage Galleria — Gariahat",
    address: "45/A, Rashbehari Avenue, Opposite Gariahat Mall, Kolkata, West Bengal 700029, India",
    phone: "+91 33 2464 5432",
    whatsapp: "+91 9876543211",
    hours: "Mon - Sat: 11:30 AM - 8:00 PM | Sun: Closed",
    mapUrl: "https://maps.google.com",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600"
  }
];
