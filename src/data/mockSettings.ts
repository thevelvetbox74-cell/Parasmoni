/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  workingHours: "Mon - Sat: 11:30 AM - 8:00 PM | Sun: Closed"
};
