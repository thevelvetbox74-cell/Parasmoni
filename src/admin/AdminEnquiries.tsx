/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  Inbox, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  ChevronRight, 
  MessageSquare,
  AlertCircle,
  Filter,
  Check
} from 'lucide-react';

interface EnquiryData {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  productCode?: string;
  productSku?: string;
  productName?: string;
  createdAt: string;
  status: 'New' | 'Contacted' | 'Closed';
}

const mockEnquiries: EnquiryData[] = [
  {
    id: 'enq-1',
    name: 'Sushant Singhania',
    phone: '+91 98300 12345',
    email: 'sushant.singh@gmail.com',
    message: 'Hello, I am interested in the Heritage Bridal Kundan Jhumkas. Is this set available for a physical trial at your Bowbazar showroom this Friday? Also, please let me know if weight customization from 45g to 38g is possible.',
    productCode: 'PM-KND-098',
    productName: 'Kundan Heritage Bridal Earrings',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    status: 'New'
  },
  {
    id: 'enq-2',
    name: 'Anjali Mukhopadhyay',
    phone: '+91 91632 98765',
    email: 'anjali.m@yahoo.co.in',
    message: 'I would like to get a quote on the current per-gram making charge for 22K Gold Antique Kadas (BIS 916). Do you accept card payments or exchange of old gold?',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    status: 'Contacted'
  },
  {
    id: 'enq-3',
    name: 'Priya Sen',
    phone: '+91 98741 02365',
    email: 'priyasen1995@outlook.com',
    message: 'Greetings, I would like to book a video consultation call with your Bowbazar designer to design a customized diamond choker set. Let me know your available slots.',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    status: 'Closed'
  }
];

export function AdminEnquiries(): React.JSX.Element {
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryData | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setEnquiries(mockEnquiries);
      setLoading(false);
      return;
    }

    try {
      const enqCol = collection(db, 'enquiries');
      const q = query(enqCol);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Anonymous Customer',
            phone: data.phone || data.mobile || '',
            email: data.email || '',
            message: data.message || '',
            productCode: data.productCode || data.sku || data.productSku || '',
            productName: data.productName || '',
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || 'New'
          };
        }) as EnquiryData[];

        // Sort by date descending
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEnquiries(fetched);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching real-time enquiries:', err);
        setErrorMsg('Failed to listen to live enquiries.');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Enquiries init error:', err);
      setErrorMsg('Failed to access inquiries store.');
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: EnquiryData['status']) => {
    try {
      setSuccessMsg(null);
      setErrorMsg(null);

      if (!isFirebaseConfigured || !db) {
        setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry(prev => prev ? { ...prev, status: newStatus } : null);
        }
        setSuccessMsg(`Status updated to ${newStatus} (Demo)`);
        return;
      }

      const docRef = doc(db, 'enquiries', id);
      await updateDoc(docRef, { status: newStatus });
      
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry(prev => prev ? { ...prev, status: newStatus } : null);
      }
      setSuccessMsg(`Enquiry marked as ${newStatus} successfully.`);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setErrorMsg('Failed to update inquiry status. Try again.');
    }
  };

  const handleDeleteEnquiry = async (enquiry: EnquiryData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete inquiry from "${enquiry.name}"?`)) {
      return;
    }

    try {
      setSuccessMsg(null);
      setErrorMsg(null);

      if (!isFirebaseConfigured || !db) {
        setEnquiries(prev => prev.filter(e => e.id !== enquiry.id));
        if (selectedEnquiry && selectedEnquiry.id === enquiry.id) {
          setSelectedEnquiry(null);
        }
        setSuccessMsg('Enquiry deleted successfully (Demo)');
        return;
      }

      const docRef = doc(db, 'enquiries', enquiry.id);
      await deleteDoc(docRef);
      if (selectedEnquiry && selectedEnquiry.id === enquiry.id) {
        setSelectedEnquiry(null);
      }
      setSuccessMsg('Enquiry deleted permanently.');
    } catch (err: any) {
      console.error('Error deleting enquiry:', err);
      setErrorMsg('Failed to delete enquiry from database.');
    }
  };

  // Filter and Search logic
  const filteredEnquiries = enquiries.filter(enq => {
    const matchesStatus = statusFilter === 'All' || enq.status === statusFilter;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      enq.name.toLowerCase().includes(query) ||
      enq.email.toLowerCase().includes(query) ||
      enq.phone.includes(query) ||
      (enq.productCode && enq.productCode.toLowerCase().includes(query)) ||
      enq.message.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeStyle = (status: EnquiryData['status']) => {
    switch (status) {
      case 'New':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Contacted':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Closed':
        return 'bg-stone-800 text-stone-500 border border-stone-800';
    }
  };

  return (
    <div className="space-y-6" id="admin-enquiries-dashboard">
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-serif font-bold text-stone-100 flex items-center gap-2">
          <Inbox className="w-5 h-5 text-amber-500" />
          <span>Customer Enquiries</span>
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          Review consultation requests, bespoke orders, and custom bridal jewellery questions submitted by digital visitors.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded flex items-center gap-2" id="enq-success">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/25 border border-red-500/20 text-red-400 text-xs rounded flex items-center gap-2" id="enq-error">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Layout */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between" id="enq-filters-bar">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone or SKU code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900/30 border border-stone-800 rounded pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Filter:</span>
          <div className="flex bg-stone-900/40 border border-stone-800 rounded p-0.5">
            {['All', 'New', 'Contacted', 'Closed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 text-[10px] tracking-wider uppercase font-bold rounded cursor-pointer transition-colors ${
                  statusFilter === filter 
                    ? 'bg-amber-500 text-stone-950 font-black' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3" id="enq-loader">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 tracking-wider">Syncing client messages...</p>
        </div>
      ) : (
        /* Split view: List vs Detail */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="enquiries-split-grid">
          {/* List panel */}
          <div className={`${selectedEnquiry ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3 transition-all`}>
            {filteredEnquiries.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-stone-850 rounded">
                <Inbox className="w-10 h-10 text-stone-700 mx-auto mb-3 animate-pulse" />
                <p className="text-xs text-stone-500 font-serif italic">No enquiries match your current filters.</p>
              </div>
            ) : (
              <div className="bg-stone-900/10 border border-stone-800 rounded overflow-hidden">
                <div className="divide-y divide-stone-850">
                  {filteredEnquiries.map((enq) => (
                    <div
                      key={enq.id}
                      onClick={() => setSelectedEnquiry(enq)}
                      className={`p-4 flex items-start gap-4 hover:bg-stone-900/30 cursor-pointer transition-colors ${
                        selectedEnquiry?.id === enq.id ? 'bg-stone-900/40 border-l-2 border-amber-500 pl-3.5' : ''
                      }`}
                    >
                      <div className="p-2 bg-stone-950 border border-stone-850 rounded-full text-stone-400 shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-amber-500" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-stone-200 truncate">
                            {enq.name}
                          </h4>
                          <span className="text-[9px] text-stone-500 font-mono tracking-wider">
                            {new Date(enq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-stone-400 line-clamp-1 leading-relaxed font-serif italic">
                          "{enq.message}"
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-stone-500">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest leading-none ${getStatusBadgeStyle(enq.status)}`}>
                            {enq.status}
                          </span>
                          
                          {enq.productCode && (
                            <span className="flex items-center gap-1 text-stone-400 font-mono font-bold uppercase leading-none">
                              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                              <span>Ref: {enq.productCode}</span>
                            </span>
                          )}

                          <span className="truncate leading-none">
                            {enq.phone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-center shrink-0">
                        <button
                          onClick={(e) => handleDeleteEnquiry(enq, e)}
                          className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-900/80 rounded transition-all cursor-pointer"
                          title="Purge inquiry document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-stone-600 hidden lg:block" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details Sidebar panel */}
          {selectedEnquiry && (
            <div className="lg:col-span-5 border border-stone-800 bg-stone-950/40 rounded p-5 space-y-5 h-fit relative animate-fade-in" id="enq-details-sidebar">
              <button 
                onClick={() => setSelectedEnquiry(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1 rounded-full hover:bg-stone-900"
              >
                <XCircle className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest font-black text-stone-300 border-b border-stone-850 pb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span>Enquiry Inspector</span>
                </h3>

                {/* Profile attributes */}
                <div className="space-y-3 bg-stone-900/30 border border-stone-850/80 rounded p-4 text-xs font-medium text-stone-300">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-stone-500 shrink-0" />
                    <span className="font-semibold text-stone-100">{selectedEnquiry.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-stone-500 shrink-0" />
                    <a href={`tel:${selectedEnquiry.phone}`} className="hover:text-amber-500 underline decoration-dotted decoration-stone-700 transition-colors">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                    <a href={`mailto:${selectedEnquiry.email}`} className="hover:text-amber-500 underline decoration-dotted decoration-stone-700 transition-colors truncate">
                      {selectedEnquiry.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-stone-500 shrink-0" />
                    <span className="font-mono text-[11px]">
                      {new Date(selectedEnquiry.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Linked reference */}
                {selectedEnquiry.productCode && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded p-3 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <ShoppingBag className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">Product Ref</p>
                        <p className="font-mono text-stone-200 font-black truncate uppercase">{selectedEnquiry.productCode}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message payload */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-black">Customer Message</p>
                  <div className="bg-stone-950 border border-stone-850 p-4 rounded text-xs text-stone-300 leading-relaxed font-serif italic whitespace-pre-wrap">
                    "{selectedEnquiry.message}"
                  </div>
                </div>

                {/* Status Toggle control block */}
                <div className="space-y-2 pt-2 border-t border-stone-850">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-black">Change Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['New', 'Contacted', 'Closed'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedEnquiry.id, status)}
                        className={`py-1.5 text-[9px] tracking-widest font-bold uppercase border rounded cursor-pointer transition-all ${
                          selectedEnquiry.status === status
                            ? 'bg-amber-500 text-stone-950 border-amber-500 font-extrabold shadow-sm'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border-stone-800'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
