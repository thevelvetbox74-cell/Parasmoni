/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, onSnapshot, doc, limit, query } from 'firebase/firestore';
import { mockWebsiteSettings, WebsiteSettings } from '../data/mockSettings';

interface FullWebsiteSettings extends WebsiteSettings {
  aboutText?: string;
  customerCareNumber?: string;
  favicon?: string;
  footerText?: string;
  googleMapsEmbed?: string;
}

interface WebsiteSettingsContextType {
  settings: FullWebsiteSettings;
  loading: boolean;
}

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType>({
  settings: mockWebsiteSettings as FullWebsiteSettings,
  loading: true
});

export function WebsiteSettingsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<FullWebsiteSettings>({
    ...mockWebsiteSettings,
    aboutText: "Established in 1974, Parasmoni Jewellers & Brothers stands as a hallmark of purity, intricate traditional filigree, and contemporary masterpieces. We curate certified gold and diamond jewellery customized to your aesthetic sensibilities.",
    customerCareNumber: "+91 33 2241 9876",
    favicon: "/favicon.ico",
    footerText: "© 2026 Parasmoni Jewellers & Brothers. All Rights Reserved. Designed with timeless elegance.",
    googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.1481119779313!2d88.35850937584102!3d22.573531479491742!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0277ab360df89d%3A0xc6c4295fa9578168!2sBowbazar%2C%20Kolkata%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1787646387697!5m2!1sen!2sin"
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    const settingsCol = collection(db, 'websiteSettings');
    const unsubscribe = onSnapshot(settingsCol, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        
        // Handle all mapping configurations and field names
        const fetched: FullWebsiteSettings = {
          brandName: docData.brandName || docData.showroomName || mockWebsiteSettings.brandName,
          tagline: docData.tagline || mockWebsiteSettings.tagline,
          establishedYear: Number(docData.establishedYear || mockWebsiteSettings.establishedYear || 1974),
          logoUrl: docData.logoUrl || docData.logo || mockWebsiteSettings.logoUrl,
          favicon: docData.favicon || "/favicon.ico",
          aboutText: docData.aboutText || "Established in 1974, Parasmoni Jewellers & Brothers stands as a hallmark of purity.",
          contactNumber: docData.contactPhone || docData.primaryPhone || docData.contactNumber || docData.phone || mockWebsiteSettings.contactNumber,
          whatsappNumber: docData.whatsappNumber || mockWebsiteSettings.whatsappNumber,
          whatsappMessage: docData.whatsappMessage || mockWebsiteSettings.whatsappMessage,
          emailAddress: docData.emailAddress || docData.contactEmail || docData.email || mockWebsiteSettings.emailAddress,
          address: docData.address || mockWebsiteSettings.address,
          customerCareNumber: docData.customerCareNumber || docData.contactPhone || mockWebsiteSettings.contactNumber,
          googleMapUrl: docData.googleMapsUrl || docData.googleMapUrl || mockWebsiteSettings.googleMapUrl,
          googleMapsEmbed: docData.googleMapsEmbed || docData.googleMapUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.1481119779313!2d88.35850937584102!3d22.573531479491742!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0277ab360df89d%3A0xc6c4295fa9578168!2sBowbazar%2C%20Kolkata%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1787646387697!5m2!1sen!2sin",
          workingHours: docData.workingHours || docData.openingHours || mockWebsiteSettings.workingHours,
          footerText: docData.footerText || "© 2026 Parasmoni Jewellers & Brothers. All Rights Reserved.",
          socials: {
            facebook: docData.socials?.facebook || docData.socialMediaLinks?.facebook || mockWebsiteSettings.socials.facebook,
            instagram: docData.socials?.instagram || docData.socialMediaLinks?.instagram || mockWebsiteSettings.socials.instagram,
            youtube: docData.socials?.youtube || docData.socialMediaLinks?.youtube || mockWebsiteSettings.socials.youtube,
            pinterest: docData.socials?.pinterest || docData.socialMediaLinks?.pinterest || mockWebsiteSettings.socials.pinterest
          }
        };
        
        setSettings(fetched);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading websiteSettings in Provider:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <WebsiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

export function useWebsiteSettings() {
  return useContext(WebsiteSettingsContext);
}
