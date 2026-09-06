/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ImageUploader } from '../components/ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { 
  User, 
  MapPin, 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Check, 
  Sparkles, 
  Eye, 
  Link2, 
  ArrowUp, 
  ArrowDown, 
  ShieldCheck 
} from 'lucide-react';
import { mockProducts } from '../data/mockData';

export interface TestimonialData {
  id?: string;
  reviewerName?: string;
  reviewerLocation?: string;
  reviewerPhotoUrl: string;
  rating?: number;
  reviewText?: string;
  verifiedBadge?: boolean;
  linkedProductId?: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  type?: 'review' | 'photo';
}

const emptyTestimonial: TestimonialData = {
  reviewerName: '',
  reviewerLocation: '',
  reviewerPhotoUrl: '',
  rating: 5,
  reviewText: '',
  verifiedBadge: true,
  linkedProductId: '',
  displayOrder: 1,
  status: 'active',
  type: 'review'
};

const defaultMockTestimonials: TestimonialData[] = [
  {
    id: 'mock-test-1',
    reviewerName: 'Ananya Sharma',
    reviewerLocation: 'Bengaluru',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    rating: 5,
    reviewText: '"The packaging of Parasmoni is genuinely breathtaking! The Royal Mayura bangle arrived with the BIS hallmark certificate. Shines even brighter than my gold jewelry."',
    verifiedBadge: true,
    linkedProductId: 'p1', // Royal Mayura
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
    linkedProductId: 'p2', // Celestial Dewdrop
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

export function AdminTestimonials(): React.JSX.Element {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentTestimonial, setCurrentTestimonial] = useState<TestimonialData>(emptyTestimonial);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load testimonials & products
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Products for Picker
      if (isFirebaseConfigured && db) {
        try {
          const productsRef = collection(db, 'products');
          const pSnapshot = await getDocs(productsRef);
          const pItems = pSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setProducts(pItems.length > 0 ? pItems : mockProducts);
        } catch (err) {
          console.error('Error loading products for picker:', err);
          setProducts(mockProducts);
        }
      } else {
        setProducts(mockProducts);
      }

      // 2. Fetch Testimonials
      if (isFirebaseConfigured && db) {
        try {
          const ref = collection(db, 'testimonials');
          const snapshot = await getDocs(ref);
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as TestimonialData[];
          
          if (items.length > 0) {
            items.sort((a, b) => a.displayOrder - b.displayOrder);
            setTestimonials(items);
          } else {
            setTestimonials(defaultMockTestimonials);
          }
        } catch (err) {
          console.error('Error fetching testimonials:', err);
          setTestimonials(defaultMockTestimonials);
        }
      } else {
        setTestimonials(defaultMockTestimonials);
      }
    } catch (err) {
      console.error('Error in loadData:', err);
      setTestimonials(defaultMockTestimonials);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (test: TestimonialData) => {
    setCurrentTestimonial(test);
    setIsEditing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAddNewReview = () => {
    const nextOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.displayOrder || 1)) + 1 : 1;
    setCurrentTestimonial({
      ...emptyTestimonial,
      type: 'review',
      displayOrder: nextOrder
    });
    setIsEditing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAddNewPhoto = () => {
    const nextOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.displayOrder || 1)) + 1 : 1;
    setCurrentTestimonial({
      ...emptyTestimonial,
      type: 'photo',
      displayOrder: nextOrder
    });
    setIsEditing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentTestimonial(emptyTestimonial);
    setErrorMsg(null);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this customer testimonial?')) return;

    try {
      setLoading(true);
      if (isFirebaseConfigured && db && !id.startsWith('mock-')) {
        await deleteDoc(doc(db, 'testimonials', id));
      }
      setTestimonials(testimonials.filter(t => t.id !== id));
      setSuccessMsg('Testimonial deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      setErrorMsg('Failed to delete testimonial.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemType = currentTestimonial.type || 'review';
    
    if (itemType === 'photo') {
      if (!currentTestimonial.reviewerPhotoUrl) {
        setErrorMsg('Uploaded customer photo is required.');
        return;
      }
    } else {
      if (!currentTestimonial.reviewerName.trim()) {
        setErrorMsg('Reviewer Name is required.');
        return;
      }
      if (!currentTestimonial.reviewText.trim()) {
        setErrorMsg('Review text quote is required.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        type: itemType,
        reviewerName: itemType === 'photo' ? '' : currentTestimonial.reviewerName.trim(),
        reviewerLocation: itemType === 'photo' ? '' : (currentTestimonial.reviewerLocation.trim() || 'Valued Guest'),
        reviewerPhotoUrl: currentTestimonial.reviewerPhotoUrl || '',
        rating: itemType === 'photo' ? 5 : Number(currentTestimonial.rating || 5),
        reviewText: currentTestimonial.reviewText.trim(),
        verifiedBadge: itemType === 'photo' ? false : Boolean(currentTestimonial.verifiedBadge),
        linkedProductId: itemType === 'photo' ? '' : (currentTestimonial.linkedProductId || ''),
        displayOrder: Number(currentTestimonial.displayOrder || 1),
        status: currentTestimonial.status || 'active'
      };

      if (isFirebaseConfigured && db) {
        if (currentTestimonial.id && !currentTestimonial.id.startsWith('mock-')) {
          await updateDoc(doc(db, 'testimonials', currentTestimonial.id), payload);
        } else {
          const docRef = await addDoc(collection(db, 'testimonials'), payload);
          currentTestimonial.id = docRef.id;
        }
      } else {
        // If local mode, generate a unique ID
        if (!currentTestimonial.id || currentTestimonial.id.startsWith('mock-')) {
          currentTestimonial.id = `mock-test-${Date.now()}`;
        }
      }

      // Refresh list
      const updatedList = [...testimonials];
      const matchIndex = updatedList.findIndex(t => t.id === currentTestimonial.id);
      
      if (matchIndex >= 0) {
        updatedList[matchIndex] = { ...currentTestimonial, ...payload };
      } else {
        updatedList.push({ ...currentTestimonial, ...payload });
      }

      updatedList.sort((a, b) => a.displayOrder - b.displayOrder);
      setTestimonials(updatedList);
      setIsEditing(false);
      setSuccessMsg('Testimonial saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error saving testimonial:', err);
      setErrorMsg('Failed to save testimonial.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reordering functions
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === testimonials.length - 1) return;

    const swapWithIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...testimonials];

    // Swap display orders
    const tempOrder = updated[index].displayOrder;
    updated[index].displayOrder = updated[swapWithIndex].displayOrder;
    updated[swapWithIndex].displayOrder = tempOrder;

    // Swap list position
    const tempItem = updated[index];
    updated[index] = updated[swapWithIndex];
    updated[swapWithIndex] = tempItem;

    setTestimonials(updated);

    // Save display orders to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const itemA = updated[index];
        const itemB = updated[swapWithIndex];
        if (itemA.id && !itemA.id.startsWith('mock-')) {
          await updateDoc(doc(db, 'testimonials', itemA.id), { displayOrder: itemA.displayOrder });
        }
        if (itemB.id && !itemB.id.startsWith('mock-')) {
          await updateDoc(doc(db, 'testimonials', itemB.id), { displayOrder: itemB.displayOrder });
        }
      } catch (err) {
        console.error('Error saving new orders:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-400 space-y-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">Loading customer reviews database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="admin-testimonials-workspace">
      
      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs rounded-lg flex items-center gap-2">
          <X className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-stone-900/30 p-4 rounded-xl border border-stone-800/40">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-300">Testimonials List ({testimonials.length})</h2>
              <p className="text-[10px] text-stone-500 font-sans mt-0.5">Admin-managed premium reviews and photo cards displaying on the live storefront.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAddNewReview}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#6B1F2A] hover:bg-[#8B2F3A] text-white rounded-lg text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Review</span>
              </button>
              <button
                onClick={handleAddNewPhoto}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-stone-950 rounded-lg text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Photo</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden border border-stone-800/80 rounded-xl bg-stone-950/50">
            <table className="w-full text-left text-xs text-stone-300 border-collapse">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900/40 text-[10px] uppercase font-bold tracking-wider text-stone-400">
                  <th className="p-4 w-12 text-center">Order</th>
                  <th className="p-4 w-16">Media/Photo</th>
                  <th className="p-4">Card Type & Details</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Quote / Caption</th>
                  <th className="p-4 w-28">Linked Item</th>
                  <th className="p-4 w-20 text-center">Status</th>
                  <th className="p-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {testimonials.map((test, index) => {
                  const linkedProd = products.find(p => p.id === test.linkedProductId);
                  const isPhotoCard = test.type === 'photo';
                  return (
                    <tr key={test.id || index} className="hover:bg-stone-900/20 transition-colors">
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-xs font-bold text-stone-400">{test.displayOrder}</span>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleMove(index, 'up')}
                              disabled={index === 0}
                              className="p-0.5 hover:bg-stone-800 rounded text-stone-400 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleMove(index, 'down')}
                              disabled={index === testimonials.length - 1}
                              className="p-0.5 hover:bg-stone-800 rounded text-stone-400 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`w-10 h-10 border border-stone-800 bg-stone-900 flex items-center justify-center overflow-hidden ${isPhotoCard ? 'rounded-lg' : 'rounded-full'}`}>
                          {test.reviewerPhotoUrl ? (
                            <img src={test.reviewerPhotoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-stone-600" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold">
                        {isPhotoCard ? (
                          <div>
                            <span className="inline-flex items-center text-[8px] font-sans font-bold uppercase tracking-wider text-amber-500 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/20 mb-1">
                              Customer Photo
                            </span>
                            <span className="text-stone-400 block text-[10px] font-medium truncate max-w-[150px]">
                              {test.reviewText || '(No caption set)'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-stone-200">{test.reviewerName}</span>
                              {test.verifiedBadge && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 fill-emerald-950/50" title="Verified Customer Badge" />
                              )}
                            </div>
                            <span className="text-[10px] text-stone-500 block">{test.reviewerLocation}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-amber-500">
                        {isPhotoCard ? (
                          <span className="text-stone-600">—</span>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: Math.min(5, Math.max(0, test.rating)) }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current shrink-0" />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-xs">
                        {isPhotoCard ? (
                          <span className="text-stone-500 italic text-[11px]">Photo Upload Card</span>
                        ) : (
                          <p className="line-clamp-2 text-stone-400 text-[11px] leading-relaxed italic">{test.reviewText}</p>
                        )}
                      </td>
                      <td className="p-4 text-[10px] text-stone-400 font-medium truncate">
                        {linkedProd && !isPhotoCard ? (
                          <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded border border-stone-800">
                            <Link2 className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{linkedProd.name}</span>
                          </div>
                        ) : (
                          <span className="text-stone-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${test.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-stone-900 text-stone-500 border border-stone-800'}`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(test)}
                            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-amber-500 rounded transition-all cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-rose-500 rounded transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-stone-950 border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-800/60 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif text-base font-bold text-stone-100">
                {currentTestimonial.id ? 'Edit Testimonial Details' : 'Add New Testimonial Card'}
              </h3>
            </div>
            <button 
              type="button" 
              onClick={handleCancel}
              className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Card Type Selector */}
          <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-stone-300 block">Testimonial Entry Type</span>
              <span className="text-[10px] text-stone-500">Choose between a premium text review card or an atmospheric customer product photo card.</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentTestimonial({ ...currentTestimonial, type: 'review' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  (currentTestimonial.type || 'review') === 'review'
                    ? 'bg-[#6B1F2A] border-[#6B1F2A] text-white'
                    : 'bg-stone-950 border-stone-850 text-stone-500 hover:text-stone-300'
                }`}
              >
                Text Review
              </button>
              <button
                type="button"
                onClick={() => setCurrentTestimonial({ ...currentTestimonial, type: 'photo' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  currentTestimonial.type === 'photo'
                    ? 'bg-amber-600 border-amber-600 text-stone-950'
                    : 'bg-stone-950 border-stone-850 text-stone-500 hover:text-stone-300'
                }`}
              >
                Customer Photo
              </button>
            </div>
          </div>

          {(currentTestimonial.type || 'review') === 'photo' ? (
            /* ====================================================
               PHOTO-ONLY TESTIMONIAL FORM
               ==================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Upload Photo */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Customer / Product Photo (Full Card Cover) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <p className="text-[10px] text-stone-500 mb-2">This photo will fill the entire card within the vertical scrolling marquee columns.</p>
                  <ImageUploader
                    id="customer-photo-uploader"
                    folder={IMAGEKIT_FOLDERS.branding}
                    value={currentTestimonial.reviewerPhotoUrl}
                    onChange={(url) => setCurrentTestimonial({ ...currentTestimonial, reviewerPhotoUrl: url })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Display Order</label>
                  <input 
                    type="number" 
                    value={currentTestimonial.displayOrder}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, displayOrder: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Right Side: Caption and Status */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Optional Caption / Attribution Text
                  </label>
                  <p className="text-[10px] text-stone-500 mb-2">Display name, location or brief review overlay. Leave blank for just a plain photo with no text.</p>
                  <textarea 
                    rows={4}
                    value={currentTestimonial.reviewText}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, reviewText: e.target.value })}
                    placeholder="e.g. Shared by Rajesh Mukherjee, Kolkata"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500 resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Publication Status</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-300">
                      <input 
                        type="radio" 
                        name="photo-status" 
                        value="active" 
                        checked={currentTestimonial.status === 'active'}
                        onChange={() => setCurrentTestimonial({ ...currentTestimonial, status: 'active' })}
                        className="text-amber-500 focus:ring-0 bg-stone-900 border-stone-800"
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-300">
                      <input 
                        type="radio" 
                        name="photo-status" 
                        value="inactive" 
                        checked={currentTestimonial.status === 'inactive'}
                        onChange={() => setCurrentTestimonial({ ...currentTestimonial, status: 'inactive' })}
                        className="text-amber-500 focus:ring-0 bg-stone-900 border-stone-800"
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ====================================================
               TEXT REVIEW TESTIMONIAL FORM
               ==================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Hand: Reviewer Profile */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Reviewer Name</label>
                  <input 
                    type="text" 
                    value={currentTestimonial.reviewerName}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, reviewerName: e.target.value })}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Reviewer Location / Landmark</label>
                  <input 
                    type="text" 
                    value={currentTestimonial.reviewerLocation}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, reviewerLocation: e.target.value })}
                    placeholder="e.g. Bowbazar, Kolkata"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Reviewer Photo (Profile Image)</label>
                  <ImageUploader
                    id="reviewer-photo-uploader"
                    folder={IMAGEKIT_FOLDERS.branding}
                    value={currentTestimonial.reviewerPhotoUrl}
                    onChange={(url) => setCurrentTestimonial({ ...currentTestimonial, reviewerPhotoUrl: url })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Star Rating Rating (1 to 5)</label>
                  <select
                    value={currentTestimonial.rating}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, rating: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    <option value={2}>⭐⭐ (2 Stars)</option>
                    <option value={1}>⭐ (1 Star)</option>
                  </select>
                </div>
              </div>

              {/* Right Hand: Content & Links */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Review Quote Text</label>
                  <textarea 
                    rows={4}
                    value={currentTestimonial.reviewText}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, reviewText: e.target.value })}
                    placeholder="Paste customer message or testimonial..."
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500 resize-none font-sans leading-relaxed"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Link Specific Showroom Product (Optional)</label>
                  <select
                    value={currentTestimonial.linkedProductId || ''}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, linkedProductId: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500"
                  >
                    <option value="">-- No Linked Product Thumbnail --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Verified Badge</label>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={currentTestimonial.verifiedBadge}
                        onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, verifiedBadge: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-300 after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      <span className="ml-2 text-xs text-stone-300">Show Badge</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Publication Status</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-300">
                        <input 
                          type="radio" 
                          name="status" 
                          value="active" 
                          checked={currentTestimonial.status === 'active'}
                          onChange={() => setCurrentTestimonial({ ...currentTestimonial, status: 'active' })}
                          className="text-amber-500 focus:ring-0 bg-stone-900 border-stone-800"
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-300">
                        <input 
                          type="radio" 
                          name="status" 
                          value="inactive" 
                          checked={currentTestimonial.status === 'inactive'}
                          onChange={() => setCurrentTestimonial({ ...currentTestimonial, status: 'inactive' })}
                          className="text-amber-500 focus:ring-0 bg-stone-900 border-stone-800"
                        />
                        <span>Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Display Order</label>
                  <input 
                    type="number" 
                    value={currentTestimonial.displayOrder}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, displayOrder: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500"
                    min="1"
                    required
                  />
                </div>
              </div>

            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800/60">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 border border-stone-800 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-stone-950 font-bold uppercase tracking-wider rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Testimonial'}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
