/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 * Parasmoni Jewellers - Navigation Header Editor Side-Drawer Panel
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  Type, 
  Link2, 
  FolderOpen, 
  Image as ImageIcon,
  Check,
  PlusCircle,
  HelpCircle,
  Menu
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { mockCollections } from '../data/mockData';
import { ImageUploader } from './ImageUploader';
import { IMAGEKIT_FOLDERS } from '../imagekit/client';
import { SmartLinkPicker } from './SmartLinkPicker';

interface NavEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  navigationList: any[];
  onNavigationListChange: (list: any[]) => void;
  navGlobalTextColor: string;
  onNavGlobalTextColorChange: (color: string) => void;
  navGlobalFontSize: string;
  onNavGlobalFontSizeChange: (size: string) => void;
  navGlobalFontWeight: string;
  onNavGlobalFontWeightChange: (weight: string) => void;
  availablePages: any[];
}

export function NavEditorPanel({
  isOpen,
  onClose,
  navigationList,
  onNavigationListChange,
  navGlobalTextColor,
  onNavGlobalTextColorChange,
  navGlobalFontSize,
  onNavGlobalFontSizeChange,
  navGlobalFontWeight,
  onNavGlobalFontWeightChange,
  availablePages
}: NavEditorPanelProps): React.JSX.Element | null {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'items' | 'styling'>('items');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  // Dynamic categories and collections
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      // Set defaults first
      setCollections(mockCollections || []);
      setCategories([
        { id: 'rings', name: 'Rings', slug: 'rings' },
        { id: 'necklaces', name: 'Necklaces', slug: 'necklaces' },
        { id: 'earrings', name: 'Earrings', slug: 'earrings' },
        { id: 'bangles', name: 'Bangles', slug: 'bangles' },
        { id: 'chains', name: 'Chains', slug: 'chains' }
      ]);

      if (!db) return;
      try {
        const colSnap = await getDocs(collection(db, 'collections'));
        if (!colSnap.empty) {
          setCollections(colSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        
        const catSnap = await getDocs(collection(db, 'categories'));
        if (!catSnap.empty) {
          setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.warn('Error fetching collections/categories for navigation links, using fallbacks:', err);
      }
    }
    loadData();
  }, []);

  // Preset colors for navigation styling
  const PRESET_COLORS = [
    { name: 'Pure White', value: '#ffffff' },
    { name: 'Warm Cream', value: '#fafaf9' },
    { name: 'Golden Accent', value: '#d97706' },
    { name: 'Silver Gray', value: '#e7e5e4' },
    { name: 'Muted Stone', value: '#a8a29e' },
    { name: 'Charcoal Black', value: '#1c1917' }
  ];

  // Deep clone helper to prevent mutating state directly
  const cloneList = (list: any[]) => JSON.parse(JSON.stringify(list));

  // Save updated list
  const updateList = (newList: any[]) => {
    onNavigationListChange(newList);
  };

  // Reordering helpers
  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const cloned = cloneList(navigationList);
    const temp = cloned[index];
    cloned[index] = cloned[index - 1];
    cloned[index - 1] = temp;
    updateList(cloned);
  };

  const moveItemDown = (index: number) => {
    if (index === navigationList.length - 1) return;
    const cloned = cloneList(navigationList);
    const temp = cloned[index];
    cloned[index] = cloned[index + 1];
    cloned[index + 1] = temp;
    updateList(cloned);
  };

  // Add Item
  const handleAddItem = () => {
    const newItem = {
      id: `nav-item-${Date.now()}`,
      label: 'New Nav Link',
      type: 'direct',
      link: { mode: 'custom', value: '/' },
      dropdownItems: [],
      megaColumns: []
    };
    updateList([...navigationList, newItem]);
    setExpandedItemId(newItem.id);
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this navigation item?')) {
      const filtered = navigationList.filter(item => item.id !== id);
      updateList(filtered);
      if (expandedItemId === id) setExpandedItemId(null);
    }
  };

  // Field edit helpers for single navigation item
  const updateItemField = (id: string, field: string, value: any) => {
    const cloned = cloneList(navigationList);
    const idx = cloned.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      cloned[idx][field] = value;
      updateList(cloned);
    }
  };

  // Nested Link Mode picker component inside drawer
  const renderLinkSelector = (
    currentLink: any,
    onLinkChange: (newLink: any) => void
  ) => {
    return (
      <div className="mt-1">
        <SmartLinkPicker
          value={currentLink}
          onChange={onLinkChange}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-stone-900 border-l border-stone-800 shadow-2xl z-50 flex flex-col font-sans text-stone-200">
      
      {/* Header Panel */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
        <div className="flex items-center gap-2">
          <Menu className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-serif font-bold text-sm text-stone-100 tracking-wider">HEADER NAVIGATION</h3>
            <p className="text-[10px] text-stone-400">Edit dynamic navbar & megamenus</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-stone-100 transition-colors"
          title="Close Navigation Editor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-stone-800 text-xs font-bold uppercase tracking-wider bg-stone-950/50">
        <button
          onClick={() => setActiveTab('items')}
          className={`py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'items' 
              ? 'border-amber-500 text-amber-500 bg-stone-900/30' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Nav Links</span>
        </button>
        <button
          onClick={() => setActiveTab('styling')}
          className={`py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'styling' 
              ? 'border-amber-500 text-amber-500 bg-stone-900/30' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Typography & Styles</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* TAB 1: NAVIGATION LINKS */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            
            {/* List Header & Add Button */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                Navbar Links ({navigationList.length})
              </span>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-md font-bold text-[10px] tracking-wider uppercase transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Empty list illustration */}
            {navigationList.length === 0 && (
              <div className="text-center py-10 px-4 border border-dashed border-stone-800 rounded-lg text-stone-500">
                <p className="text-xs">No links added to the Header navigation bar.</p>
                <button
                  onClick={handleAddItem}
                  className="mt-3 text-amber-500 font-bold hover:text-amber-400 text-[10px] uppercase tracking-wider flex items-center gap-1 mx-auto"
                >
                  <PlusCircle className="w-4 h-4" /> Add your first link
                </button>
              </div>
            )}

            {/* Navigation Items List */}
            <div className="space-y-2">
              {navigationList.map((item, index) => {
                const isExpanded = expandedItemId === item.id;
                
                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                      isExpanded 
                        ? 'border-amber-600/50 bg-stone-950/40' 
                        : 'border-stone-800 bg-stone-900 hover:border-stone-750'
                    }`}
                  >
                    
                    {/* Item Row Header */}
                    <div 
                      className="p-3 flex items-center justify-between cursor-pointer select-none"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => { e.stopPropagation(); moveItemUp(index); }}
                            className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-30 disabled:hover:text-stone-500 transition-colors"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === navigationList.length - 1}
                            onClick={(e) => { e.stopPropagation(); moveItemDown(index); }}
                            className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-30 disabled:hover:text-stone-500 transition-colors"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-stone-100 uppercase tracking-wider">{item.label}</h4>
                          <span className="text-[9px] text-stone-400 uppercase font-semibold">
                            {item.type === 'direct' ? 'Direct URL' : item.type === 'dropdown' ? 'Dropdown Menu' : 'Mega Menu'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                          className="p-1 text-stone-500 hover:text-red-500 transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="text-stone-500 text-xs font-serif font-bold px-1 select-none">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Editor Pane */}
                    {isExpanded && (
                      <div className="p-4 border-t border-stone-850 space-y-4 bg-stone-950/65 animate-fade-in text-xs">
                        
                        {/* Item Label Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Link Label</label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateItemField(item.id, 'label', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 font-semibold"
                          />
                        </div>

                        {/* Text Color Override */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Text Color Override (Optional)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={item.textColor || ''}
                              onChange={(e) => updateItemField(item.id, 'textColor', e.target.value || undefined)}
                              placeholder="e.g. #D97706 or leave blank for default"
                              className="flex-1 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 font-mono"
                            />
                            {item.textColor && (
                              <div 
                                className="w-8 h-8 rounded border border-stone-800"
                                style={{ backgroundColor: item.textColor }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Nav Type Selector */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Menu Display Type</label>
                          <div className="grid grid-cols-3 gap-1 bg-stone-900 p-1 rounded border border-stone-800">
                            {([
                              { val: 'direct', lbl: 'Direct' },
                              { val: 'dropdown', lbl: 'Dropdown' },
                              { val: 'mega', lbl: 'Mega Menu' }
                            ] as const).map((t) => (
                              <button
                                key={t.val}
                                type="button"
                                onClick={() => {
                                  const cloned = cloneList(navigationList);
                                  const idx = cloned.findIndex((i: any) => i.id === item.id);
                                  if (idx !== -1) {
                                    cloned[idx].type = t.val;
                                    // Seed default nested variables if empty
                                    if (t.val === 'dropdown' && (!cloned[idx].dropdownItems || cloned[idx].dropdownItems.length === 0)) {
                                      cloned[idx].dropdownItems = [
                                        { id: `sub-${Date.now()}-1`, title: 'All Jewellery', link: { mode: 'custom', value: '/catalog' } }
                                      ];
                                    }
                                    if (t.val === 'mega' && (!cloned[idx].megaColumns || cloned[idx].megaColumns.length === 0)) {
                                      cloned[idx].megaColumns = [
                                        { 
                                          id: `col-${Date.now()}-1`, 
                                          subtitle: 'Shop by Category', 
                                          links: [
                                            { id: `ml-${Date.now()}-1`, label: 'Rings', link: { mode: 'category', value: 'rings' } },
                                            { id: `ml-${Date.now()}-2`, label: 'Earrings', link: { mode: 'category', value: 'earrings' } }
                                          ]
                                        }
                                      ];
                                    }
                                    updateList(cloned);
                                  }
                                }}
                                className={`py-1.5 text-[9px] font-bold rounded uppercase tracking-wider text-center transition-all ${
                                  item.type === t.val 
                                    ? 'bg-amber-600 text-stone-950 font-black' 
                                    : 'text-stone-400 hover:text-stone-200'
                                }`}
                              >
                                {t.lbl}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Case 1: Direct Link Path Picker */}
                        {item.type === 'direct' && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block flex items-center gap-1">
                              <Link2 className="w-3.5 h-3.5" />
                              <span>Destination Link</span>
                            </label>
                            {renderLinkSelector(item.link, (newLink) => {
                              updateItemField(item.id, 'link', newLink);
                            })}
                          </div>
                        )}

                        {/* Case 2: Dropdown Subitems Editor */}
                        {item.type === 'dropdown' && (
                          <div className="space-y-3 pt-2 border-t border-stone-850">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block">Dropdown Subitems</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const cloned = cloneList(navigationList);
                                  const idx = cloned.findIndex((i: any) => i.id === item.id);
                                  if (idx !== -1) {
                                    cloned[idx].dropdownItems = cloned[idx].dropdownItems || [];
                                    cloned[idx].dropdownItems.push({
                                      id: `sub-${Date.now()}`,
                                      title: 'New Link',
                                      link: { mode: 'custom', value: '/' }
                                    });
                                    updateList(cloned);
                                  }
                                }}
                                className="text-[9px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider flex items-center gap-1"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> Add Sublink
                              </button>
                            </div>

                            {/* Dropdown nested items render */}
                            <div className="space-y-2">
                              {(item.dropdownItems || []).map((sub: any, subIdx: number) => (
                                <div key={sub.id} className="p-3 bg-stone-900 border border-stone-850 rounded-lg space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <input
                                      type="text"
                                      value={sub.title}
                                      onChange={(e) => {
                                        const cloned = cloneList(navigationList);
                                        const idx = cloned.findIndex((i: any) => i.id === item.id);
                                        if (idx !== -1) {
                                          cloned[idx].dropdownItems[subIdx].title = e.target.value;
                                          updateList(cloned);
                                        }
                                      }}
                                      className="bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-100 outline-none focus:border-amber-500/50 font-bold"
                                      placeholder="Sub-item Title"
                                    />
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        disabled={subIdx === 0}
                                        onClick={() => {
                                          const cloned = cloneList(navigationList);
                                          const idx = cloned.findIndex((i: any) => i.id === item.id);
                                          if (idx !== -1) {
                                            const temp = cloned[idx].dropdownItems[subIdx];
                                            cloned[idx].dropdownItems[subIdx] = cloned[idx].dropdownItems[subIdx - 1];
                                            cloned[idx].dropdownItems[subIdx - 1] = temp;
                                            updateList(cloned);
                                          }
                                        }}
                                        className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-100 disabled:opacity-20"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={subIdx === item.dropdownItems.length - 1}
                                        onClick={() => {
                                          const cloned = cloneList(navigationList);
                                          const idx = cloned.findIndex((i: any) => i.id === item.id);
                                          if (idx !== -1) {
                                            const temp = cloned[idx].dropdownItems[subIdx];
                                            cloned[idx].dropdownItems[subIdx] = cloned[idx].dropdownItems[subIdx + 1];
                                            cloned[idx].dropdownItems[subIdx + 1] = temp;
                                            updateList(cloned);
                                          }
                                        }}
                                        className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-100 disabled:opacity-20"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cloned = cloneList(navigationList);
                                          const idx = cloned.findIndex((i: any) => i.id === item.id);
                                          if (idx !== -1) {
                                            cloned[idx].dropdownItems.splice(subIdx, 1);
                                            updateList(cloned);
                                          }
                                        }}
                                        className="p-1 hover:bg-stone-800 rounded text-stone-500 hover:text-red-500"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Subitem Color Picker */}
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Link Color (Optional)</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={sub.color || ''}
                                        onChange={(e) => {
                                          const cloned = cloneList(navigationList);
                                          const idx = cloned.findIndex((i: any) => i.id === item.id);
                                          if (idx !== -1) {
                                            cloned[idx].dropdownItems[subIdx].color = e.target.value || undefined;
                                            updateList(cloned);
                                          }
                                        }}
                                        placeholder="e.g. #D97706 or leave empty"
                                        className="flex-1 bg-stone-950 border border-stone-850 rounded px-2.5 py-1 text-xs text-stone-200 outline-none focus:border-amber-500/50 font-mono"
                                      />
                                      {sub.color && (
                                        <div 
                                          className="w-6 h-6 rounded border border-stone-800 shrink-0"
                                          style={{ backgroundColor: sub.color }}
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {renderLinkSelector(sub.link, (newLink) => {
                                    const cloned = cloneList(navigationList);
                                    const idx = cloned.findIndex((i: any) => i.id === item.id);
                                    if (idx !== -1) {
                                      cloned[idx].dropdownItems[subIdx].link = newLink;
                                      updateList(cloned);
                                    }
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Case 3: Mega Menu Editor */}
                        {item.type === 'mega' && (
                          <div className="space-y-4 pt-2 border-t border-stone-850">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block">Mega Menu Columns (Max 4)</label>
                              <button
                                type="button"
                                disabled={(item.megaColumns || []).length >= 4}
                                onClick={() => {
                                  const cloned = cloneList(navigationList);
                                  const idx = cloned.findIndex((i: any) => i.id === item.id);
                                  if (idx !== -1) {
                                    cloned[idx].megaColumns = cloned[idx].megaColumns || [];
                                    cloned[idx].megaColumns.push({
                                      id: `col-${Date.now()}`,
                                      subtitle: 'New Column',
                                      links: [],
                                      image: ''
                                    });
                                    updateList(cloned);
                                  }
                                }}
                                className="text-[9px] font-bold text-amber-500 hover:text-amber-400 disabled:opacity-30 uppercase tracking-wider flex items-center gap-1"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> Add Column
                              </button>
                            </div>

                            <div className="space-y-3">
                              {(item.megaColumns || []).map((col: any, colIdx: number) => (
                                <div key={col.id} className="p-3 bg-stone-900 border border-stone-800 rounded-lg space-y-3">
                                  
                                  {/* Column Name Header */}
                                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                                    <input
                                      type="text"
                                      value={col.subtitle}
                                      onChange={(e) => {
                                        const cloned = cloneList(navigationList);
                                        const idx = cloned.findIndex((i: any) => i.id === item.id);
                                        if (idx !== -1) {
                                          cloned[idx].megaColumns[colIdx].subtitle = e.target.value;
                                          updateList(cloned);
                                        }
                                      }}
                                      className="bg-stone-950 border border-stone-850 rounded px-2 py-1 text-xs text-brand-red-400 outline-none focus:border-amber-500/50 font-serif font-black uppercase tracking-wider"
                                      placeholder="Column Title"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cloned = cloneList(navigationList);
                                        const idx = cloned.findIndex((i: any) => i.id === item.id);
                                        if (idx !== -1) {
                                          cloned[idx].megaColumns.splice(colIdx, 1);
                                          updateList(cloned);
                                        }
                                      }}
                                      className="p-1 hover:bg-stone-800 rounded text-stone-500 hover:text-red-500"
                                      title="Delete Column"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Column Title Color Picker */}
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Title Color (Optional)</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={col.titleColor || ''}
                                        onChange={(e) => {
                                          const cloned = cloneList(navigationList);
                                          const idx = cloned.findIndex((i: any) => i.id === item.id);
                                          if (idx !== -1) {
                                            cloned[idx].megaColumns[colIdx].titleColor = e.target.value || undefined;
                                            updateList(cloned);
                                          }
                                        }}
                                        placeholder="e.g. #D97706 or leave empty"
                                        className="flex-1 bg-stone-950 border border-stone-850 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-amber-500/50 font-mono"
                                      />
                                      {col.titleColor && (
                                        <div 
                                          className="w-6 h-6 rounded border border-stone-800 shrink-0"
                                          style={{ backgroundColor: col.titleColor }}
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Column Image Upload Field (Optional) */}
                                  <div className="space-y-1.5">
                                    <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3 text-stone-400" />
                                      <span>Column Banner Image (Optional)</span>
                                    </label>
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        value={col.image || ''}
                                        onChange={(e) => {
                                          const cloned = cloneList(navigationList);
                                          const idx = cloned.findIndex((i: any) => i.id === item.id);
                                          if (idx !== -1) {
                                            cloned[idx].megaColumns[colIdx].image = e.target.value;
                                            updateList(cloned);
                                          }
                                        }}
                                        placeholder="Image URL or upload below"
                                        className="w-full bg-stone-950 border border-stone-850 rounded px-2 py-1 text-[11px] text-stone-200 outline-none"
                                      />
                                      <div className="bg-stone-950/40 p-2 rounded border border-stone-850">
                                        <ImageUploader 
                                          id={`nav-col-img-${item.id}-${colIdx}`}
                                          folder={IMAGEKIT_FOLDERS.banners}
                                          value={col.image || ''}
                                          onChange={(val) => {
                                            const url = Array.isArray(val) ? val[0] : val;
                                            const cloned = cloneList(navigationList);
                                            const idx = cloned.findIndex((i: any) => i.id === item.id);
                                            if (idx !== -1) {
                                              cloned[idx].megaColumns[colIdx].image = url;
                                              updateList(cloned);
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Sublinks within Column */}
                                  <div className="space-y-2.5 pt-2 border-t border-stone-850">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Column Links</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cloned = cloneList(navigationList);
                                          const idx = cloned.findIndex((i: any) => i.id === item.id);
                                          if (idx !== -1) {
                                            cloned[idx].megaColumns[colIdx].links = cloned[idx].megaColumns[colIdx].links || [];
                                            cloned[idx].megaColumns[colIdx].links.push({
                                              id: `ml-${Date.now()}`,
                                              label: 'Sub Link',
                                              link: { mode: 'custom', value: '/' }
                                            });
                                            updateList(cloned);
                                          }
                                        }}
                                        className="text-[8px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider flex items-center gap-0.5"
                                      >
                                        <Plus className="w-3 h-3" /> Add Link
                                      </button>
                                    </div>

                                    {/* Links renderer */}
                                    <div className="space-y-2">
                                      {(col.links || []).map((subL: any, subLIdx: number) => (
                                        <div key={subL.id} className="p-2 bg-stone-950 rounded-lg space-y-2 border border-stone-850">
                                          <div className="flex items-center justify-between">
                                            <input
                                              type="text"
                                              value={subL.label}
                                              onChange={(e) => {
                                                const cloned = cloneList(navigationList);
                                                const idx = cloned.findIndex((i: any) => i.id === item.id);
                                                if (idx !== -1) {
                                                  cloned[idx].megaColumns[colIdx].links[subLIdx].label = e.target.value;
                                                  updateList(cloned);
                                                }
                                              }}
                                              className="bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 font-semibold"
                                              placeholder="Link text"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const cloned = cloneList(navigationList);
                                                const idx = cloned.findIndex((i: any) => i.id === item.id);
                                                if (idx !== -1) {
                                                  cloned[idx].megaColumns[colIdx].links.splice(subLIdx, 1);
                                                  updateList(cloned);
                                                }
                                              }}
                                              className="p-1 hover:bg-stone-800 rounded text-stone-500 hover:text-red-500"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {/* Link Color Picker */}
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-bold text-stone-400 uppercase tracking-wider block">Link Color (Optional)</label>
                                            <div className="flex gap-2">
                                              <input
                                                type="text"
                                                value={subL.color || ''}
                                                onChange={(e) => {
                                                  const cloned = cloneList(navigationList);
                                                  const idx = cloned.findIndex((i: any) => i.id === item.id);
                                                  if (idx !== -1) {
                                                    cloned[idx].megaColumns[colIdx].links[subLIdx].color = e.target.value || undefined;
                                                    updateList(cloned);
                                                  }
                                                }}
                                                placeholder="e.g. #D97706 or leave empty"
                                                className="flex-1 bg-stone-900 border border-stone-850 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-amber-500/50 font-mono"
                                              />
                                              {subL.color && (
                                                <div 
                                                  className="w-6 h-6 rounded border border-stone-800 shrink-0"
                                                  style={{ backgroundColor: subL.color }}
                                                />
                                              )}
                                            </div>
                                          </div>

                                          {renderLinkSelector(subL.link, (newLink) => {
                                            const cloned = cloneList(navigationList);
                                            const idx = cloned.findIndex((i: any) => i.id === item.id);
                                            if (idx !== -1) {
                                              cloned[idx].megaColumns[colIdx].links[subLIdx].link = newLink;
                                              updateList(cloned);
                                            }
                                          })}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 2: STYLING PANEL */}
        {activeTab === 'styling' && (
          <div className="space-y-4">
            
            {/* Global Text Color Control */}
            <div className="space-y-2 p-3.5 bg-stone-950/40 border border-stone-800 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <Palette className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest">Global Link Color</span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={navGlobalTextColor}
                  onChange={(e) => onNavGlobalTextColorChange(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 font-mono"
                />
                <div 
                  className="w-8 h-8 rounded border border-stone-800 shadow-sm shrink-0"
                  style={{ backgroundColor: navGlobalTextColor }}
                />
              </div>

              {/* Color Presets */}
              <div className="mt-3">
                <p className="text-[8px] text-stone-500 uppercase font-bold tracking-wider mb-1.5">Preset Palette</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => onNavGlobalTextColorChange(preset.value)}
                      className={`flex items-center gap-1.5 p-1 px-2 rounded bg-stone-900 border text-[9px] font-bold text-stone-300 cursor-pointer ${
                        navGlobalTextColor === preset.value ? 'border-amber-500 text-amber-500' : 'border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-stone-750 shrink-0" style={{ backgroundColor: preset.value }} />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Global Font Size Control */}
            <div className="space-y-2 p-3.5 bg-stone-950/40 border border-stone-800 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <Type className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest">Link Font Size</span>
              </div>
              
              <select
                value={navGlobalFontSize}
                onChange={(e) => onNavGlobalFontSizeChange(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 cursor-pointer font-bold"
              >
                <option value="10px">Tiny (10px)</option>
                <option value="11px">Normal (11px)</option>
                <option value="12px">Medium (12px)</option>
                <option value="13px">Large (13px)</option>
                <option value="14px">Extra Large (14px)</option>
              </select>
              <p className="text-[9px] text-stone-400">Controls the base font-size of direct links and top-level headers.</p>
            </div>

            {/* Global Font Weight Control */}
            <div className="space-y-2 p-3.5 bg-stone-950/40 border border-stone-800 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <Type className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest">Link Font Weight</span>
              </div>
              
              <select
                value={navGlobalFontWeight}
                onChange={(e) => onNavGlobalFontWeightChange(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-500/50 cursor-pointer font-bold"
              >
                <option value="font-normal">Normal (400)</option>
                <option value="font-medium">Medium (500)</option>
                <option value="font-semibold">Semi-Bold (600)</option>
                <option value="font-bold">Bold (700)</option>
                <option value="font-extrabold">Extra Bold (800)</option>
              </select>
              <p className="text-[9px] text-stone-400">Sets the weight/thickness class applied to the navigation items.</p>
            </div>

          </div>
        )}

      </div>

      {/* Save action block inside drawer */}
      <div className="p-4 bg-stone-950 border-t border-stone-850 flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold tracking-widest uppercase rounded-lg shadow-md transition-all duration-200"
        >
          Close & Preview
        </button>
      </div>

    </div>
  );
}
