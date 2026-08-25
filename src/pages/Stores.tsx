/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock, 
  Search, 
  Compass, 
  Calendar,
  AlertCircle,
  Map,
  ChevronDown,
  ChevronUp,
  X,
  PhoneCall
} from 'lucide-react';
import { getOptimizedShowroomUrl } from '../imagekit/client';
import { mockStores } from '../data/mockData';

interface StoreLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp?: string;
  hours?: string;
  workingHours?: string;
  mapUrl?: string;
  googleMapsUrl?: string;
  imageUrl?: string;
  city?: string;
  area?: string;
  weeklyOff?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  displayOrder?: number;
  order?: number;
}

export function Stores(): React.JSX.Element {
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cityFilter, setCityFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  // Lists for quick dropdown filtering
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // 1. Fetch stores from Firestore
  useEffect(() => {
    async function loadStores() {
      try {
        setLoading(true);
        const storesRef = collection(db, 'stores');
        // Retrieve and try to order by displayOrder or order
        const qStores = query(storesRef);
        const snapshot = await getDocs(qStores);

        let fetchedStores: StoreLocation[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || data.whatsappNumber || '',
            hours: data.hours || data.workingHours || '',
            workingHours: data.workingHours || data.hours || '',
            mapUrl: data.mapUrl || data.googleMapsUrl || '',
            googleMapsUrl: data.googleMapsUrl || data.mapUrl || '',
            imageUrl: data.imageUrl || '',
            city: data.city || '',
            area: data.area || '',
            weeklyOff: data.weeklyOff || '',
            latitude: data.latitude !== undefined ? Number(data.latitude) : (data.lat !== undefined ? Number(data.lat) : undefined),
            longitude: data.longitude !== undefined ? Number(data.longitude) : (data.lng !== undefined ? Number(data.lng) : undefined),
            lat: data.lat !== undefined ? Number(data.lat) : undefined,
            lng: data.lng !== undefined ? Number(data.lng) : undefined,
            displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : (data.order !== undefined ? Number(data.order) : 999),
            isActive: data.isActive !== undefined ? data.isActive : (data.status !== 'inactive')
          } as any;
        });

        // Filter active ones
        fetchedStores = fetchedStores.filter((s: any) => s.isActive !== false);

        // Sort by displayOrder
        fetchedStores.sort((a, b) => {
          const orderA = a.displayOrder ?? a.order ?? 999;
          const orderB = b.displayOrder ?? b.order ?? 999;
          return orderA - orderB;
        });

        if (fetchedStores.length > 0) {
          setStores(fetchedStores);
        } else {
          // Fallback to enhanced mock stores
          setStores(getEnhancedMockStores());
        }
      } catch (err) {
        console.warn("Could not retrieve active store registries, applying fallback configurations", err);
        setStores(getEnhancedMockStores());
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, []);

  // 2. Generate unique filters when stores load
  useEffect(() => {
    if (stores.length > 0) {
      const cities = Array.from(new Set(stores.map(s => s.city || extractCity(s.address))))
        .filter(Boolean) as string[];
      const areas = Array.from(new Set(stores.map(s => s.area || extractArea(s.address))))
        .filter(Boolean) as string[];

      setAvailableCities(cities);
      setAvailableAreas(areas);
    }
  }, [stores]);

  // Extract fallback city from address
  function extractCity(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length > 2) {
      // Find the second to last part (often city/state)
      const part = parts[parts.length - 2].trim();
      return part.split(' ')[0] || '';
    }
    return '';
  }

  // Extract fallback area from address
  function extractArea(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length > 1) {
      return parts[1].trim() || parts[0].trim();
    }
    return '';
  }

  // Generate mock stores enriched with proper city/area/coordinate data for filtering
  function getEnhancedMockStores(): StoreLocation[] {
    return [
      {
        id: "store-1",
        name: "Flagship Showroom — Bowbazar",
        address: "123, Bowbazar Street, Near Lalbazar Crossing, Kolkata, West Bengal 700012, India",
        phone: "+91 33 2241 9876",
        whatsapp: "+91 9876543210",
        hours: "Mon - Sat: 11:30 AM - 8:00 PM",
        weeklyOff: "Sunday",
        mapUrl: "https://maps.google.com/?q=22.5694,88.3582",
        googleMapsUrl: "https://maps.google.com/?q=22.5694,88.3582",
        imageUrl: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=600",
        city: "Kolkata",
        area: "Bowbazar",
        latitude: 22.5694,
        longitude: 88.3582,
        displayOrder: 1
      },
      {
        id: "store-2",
        name: "Heritage Galleria — Gariahat",
        address: "45/A, Rashbehari Avenue, Opposite Gariahat Mall, Kolkata, West Bengal 700029, India",
        phone: "+91 33 2464 5432",
        whatsapp: "+91 9876543211",
        hours: "Mon - Sat: 11:30 AM - 8:00 PM",
        weeklyOff: "Sunday",
        mapUrl: "https://maps.google.com/?q=22.5186,88.3678",
        googleMapsUrl: "https://maps.google.com/?q=22.5186,88.3678",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600",
        city: "Kolkata",
        area: "Gariahat",
        latitude: 22.5186,
        longitude: 88.3678,
        displayOrder: 2
      }
    ];
  }

  // 3. Filtering logic
  const filteredStores = stores.filter(store => {
    const city = store.city || extractCity(store.address);
    const area = store.area || extractArea(store.address);

    const matchesCity = !cityFilter || city.toLowerCase() === cityFilter.toLowerCase();
    const matchesArea = !areaFilter || area.toLowerCase() === areaFilter.toLowerCase();
    
    const combinedSearchStr = `${store.name} ${store.address} ${city} ${area}`.toLowerCase();
    const matchesSearch = !searchQuery || combinedSearchStr.includes(searchQuery.toLowerCase());

    return matchesCity && matchesArea && matchesSearch;
  });

  const clearFilters = () => {
    setCityFilter('');
    setAreaFilter('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 font-sans" id="showroom-stores-view">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Block */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] text-amber-700 font-bold tracking-widest uppercase block">Our Heritage Locations</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-wide">
            Visit Our Showrooms
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-sans">
            Step into the world of Parasmoni Jewellers. Experience our entire catalogue in-person, consult with our master artisans, and find your next family heirloom.
          </p>
        </div>

        {/* Filter Controls (City, Area, Search) */}
        <div className="bg-white border border-stone-200 rounded p-4 sm:p-6 shadow-xs space-y-4" id="stores-filter-panel">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by showroom name, street..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 text-xs text-stone-800 placeholder-stone-400 pl-10 pr-4 py-3 rounded border border-stone-200 focus:outline-hidden focus:border-amber-600 focus:bg-white transition-all"
                id="store-search-query"
              />
            </div>

            {/* City Dropdown */}
            <div className="md:col-span-3 relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full bg-stone-50 text-xs text-stone-700 py-3 pl-4 pr-10 rounded border border-stone-200 focus:outline-hidden focus:border-amber-600 focus:bg-white transition-all appearance-none cursor-pointer"
                id="store-city-select"
              >
                <option value="">All Cities</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Area Dropdown */}
            <div className="md:col-span-3 relative">
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full bg-stone-50 text-xs text-stone-700 py-3 pl-4 pr-10 rounded border border-stone-200 focus:outline-hidden focus:border-amber-600 focus:bg-white transition-all appearance-none cursor-pointer"
                id="store-area-select"
              >
                <option value="">All Areas</option>
                {availableAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Button */}
            <div className="md:col-span-1">
              <button
                onClick={clearFilters}
                className="w-full h-full bg-stone-100 hover:bg-stone-200 text-stone-700 p-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer transition-colors"
                title="Reset Filters"
                id="store-filters-reset"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Filter Status Badge strip */}
          {(cityFilter || areaFilter || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-[10px]">
              <span className="text-stone-400 uppercase tracking-widest font-bold mr-1">Active Filters:</span>
              {searchQuery && (
                <span className="bg-stone-100 border border-stone-200 text-stone-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>Query: "{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-stone-950 font-bold">×</button>
                </span>
              )}
              {cityFilter && (
                <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>City: {cityFilter}</span>
                  <button onClick={() => setCityFilter('')} className="hover:text-amber-950 font-bold">×</button>
                </span>
              )}
              {areaFilter && (
                <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>Area: {areaFilter}</span>
                  <button onClick={() => setAreaFilter('')} className="hover:text-amber-950 font-bold">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 text-center" id="stores-loader">
            <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-stone-500 text-xs tracking-wider uppercase mt-4">Mapping Our Showrooms...</p>
          </div>
        ) : filteredStores.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-stone-200 rounded p-12 text-center max-w-md mx-auto space-y-4 shadow-2xs" id="stores-empty-pane">
            <AlertCircle className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-900">No Showrooms Match Your Criteria</h3>
            <p className="text-stone-500 text-xs leading-relaxed font-sans">
              We currently do not have a registered showroom matching those specific locations. Try expanding your search queries or resetting filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-2 inline-flex h-10 px-6 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-bold tracking-widest uppercase rounded items-center gap-2 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Store Locations Listings Grid */
          <div className="space-y-8" id="showroom-cards-deck">
            {filteredStores.map((store) => {
              const displayImg = store.imageUrl || "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=600";
              const optimizedUrl = getOptimizedShowroomUrl(displayImg, { width: 600, height: 400 });
              
              const isMapExpanded = expandedMapId === store.id;
              
              // Resolve geo coordinates
              const hasCoordinates = (store.latitude !== undefined && store.longitude !== undefined) || 
                                     (store.lat !== undefined && store.lng !== undefined);
              const latVal = store.latitude ?? store.lat;
              const lngVal = store.longitude ?? store.lng;

              // Hours / Weekly Off formulation
              const resolvedHours = store.hours || store.workingHours || "11:30 AM - 8:00 PM";
              const resolvedWeeklyOff = store.weeklyOff || (resolvedHours.toLowerCase().includes('sun: closed') ? 'Sunday' : 'Sunday');

              // Clean Phone and WhatsApp
              const cleanPhone = store.phone.replace(/[^0-9+]/g, '');
              const cleanWhatsapp = (store.whatsapp || '').replace(/[^0-9]/g, '');
              const directionUrl = store.googleMapsUrl || store.mapUrl || (hasCoordinates ? `https://www.google.com/maps/search/?api=1&query=${latVal},${lngVal}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + store.address)}`);

              return (
                <div 
                  key={store.id} 
                  className="bg-white border border-stone-200/80 rounded overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300"
                  id={`store-card-${store.id}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* Visual Photo Panel (5/12) */}
                    <div className="lg:col-span-5 relative aspect-video lg:aspect-auto min-h-[250px] bg-stone-100 overflow-hidden group">
                      <img 
                        src={optimizedUrl} 
                        alt={store.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-900/10" />
                      
                      {store.city && (
                        <span className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-xs text-stone-100 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded">
                          {store.city}
                        </span>
                      )}
                    </div>

                    {/* Metadata Panel (7/12) */}
                    <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] text-amber-700 font-bold tracking-widest uppercase block mb-1">
                            PARASMONI SHOWROOM
                          </span>
                          <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                            {store.name}
                          </h2>
                          {store.area && (
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                              {store.area} District
                            </p>
                          )}
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
                          
                          <div className="flex gap-2.5 items-start">
                            <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed font-sans">{store.address}</span>
                          </div>

                          <div className="space-y-2.5">
                            <div className="flex gap-2.5 items-center">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="font-sans">Open: {resolvedHours}</span>
                            </div>
                            {resolvedWeeklyOff && (
                              <div className="flex gap-2.5 items-center">
                                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                                <span className="font-sans font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                                  Weekly Off: {resolvedWeeklyOff}
                                </span>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* Interactive Actions Deck */}
                      <div className="space-y-4 pt-4 border-t border-stone-100">
                        <div className="flex flex-wrap gap-3">
                          
                          {/* Get Directions */}
                          <a
                            href={directionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-50 text-[10px] font-bold tracking-widest uppercase transition-colors rounded px-5 py-3 cursor-pointer"
                            id={`directions-btn-${store.id}`}
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Get Directions</span>
                          </a>

                          {/* Call Now */}
                          <a
                            href={`tel:${cleanPhone}`}
                            className="inline-flex items-center justify-center gap-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[10px] font-bold tracking-widest uppercase transition-colors rounded px-5 py-3 cursor-pointer"
                            id={`call-btn-${store.id}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-amber-600" />
                            <span>Call</span>
                          </a>

                          {/* WhatsApp Chat */}
                          {cleanWhatsapp && (
                            <a
                              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hello Parasmoni Jewellers, I would like to schedule a showroom visit/consultation at your ${store.name} branch.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[10px] font-bold tracking-widest uppercase transition-colors rounded px-5 py-3 cursor-pointer"
                              id={`whatsapp-btn-${store.id}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {/* Toggle Map Embed inside the card (If lat/lng available) */}
                          {hasCoordinates && (
                            <button
                              onClick={() => setExpandedMapId(isMapExpanded ? null : store.id)}
                              className="inline-flex items-center justify-center gap-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[10px] font-bold tracking-widest uppercase transition-all rounded px-5 py-3 cursor-pointer ml-auto"
                              id={`toggle-map-${store.id}`}
                            >
                              <Map className="w-3.5 h-3.5 text-blue-600" />
                              <span>{isMapExpanded ? "Hide Map" : "Show Map"}</span>
                            </button>
                          )}

                        </div>

                        {/* Collapsible Iframe Map Embed Block */}
                        {hasCoordinates && isMapExpanded && (
                          <div className="w-full h-64 bg-stone-100 rounded border border-stone-200 overflow-hidden animate-fade-in-up mt-4">
                            <iframe
                              src={`https://maps.google.com/maps?q=${latVal},${lngVal}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen={false}
                              loading="lazy"
                              title={`${store.name} Map Location`}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
