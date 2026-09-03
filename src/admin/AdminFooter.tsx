/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Full-featured Footer Visual Builder & Editor Panel
 */

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  Sparkles, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Check, 
  ExternalLink, 
  Paintbrush, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  Eye,
  RefreshCw,
  Sliders,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  Upload,
  BookOpen,
  ShoppingBag,
  Settings,
  HelpCircle,
  Code,
  X
} from 'lucide-react';
import { Footer } from '../components/Footer';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_FOOTER_CONFIG, FooterConfig, LinkColumn, FooterLink, ContactIcon, SocialPlatform, PaymentBadge } from '../data/defaultFooterConfig';
import { ImageUploader } from '../components/ImageUploader';
import { SmartLinkPicker } from '../components/SmartLinkPicker';

type TabId = 'global' | 'brand' | 'links' | 'contact' | 'social' | 'badges' | 'legal';

export function AdminFooter(): React.JSX.Element {
  // Master states
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [savedConfig, setSavedConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [loading, setLoading] = useState(true);
  
  // Statuses
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [resetStatus, setResetStatus] = useState<'idle' | 'resetting' | 'done'>('idle');
  
  // Builder configuration
  const [activeTab, setActiveTab] = useState<TabId>('global');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Load and merge current database parameters
  useEffect(() => {
    async function fetchFooterConfig() {
      try {
        setLoading(true);
        if (!isFirebaseConfigured || !db) {
          const cached = localStorage.getItem('website_footer_settings');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const merged = mergeWithDefaults(parsed);
              setConfig(merged);
              setSavedConfig(merged);
            } catch (e) {
              console.error('Error parsing local footer cache:', e);
            }
          }
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'websiteSettings', 'footer');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const dbData = snap.data();
          const merged = mergeWithDefaults(dbData);
          setConfig(merged);
          setSavedConfig(merged);
        } else {
          // No doc, use standard defaults
          setConfig(DEFAULT_FOOTER_CONFIG);
          setSavedConfig(DEFAULT_FOOTER_CONFIG);
        }
      } catch (err) {
        console.error('Error fetching footer configurations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFooterConfig();
  }, []);

  // Helper to merge database settings with defaults safely to prevent broken layouts
  const mergeWithDefaults = (dbData: any): FooterConfig => {
    return {
      ...DEFAULT_FOOTER_CONFIG,
      ...dbData,
      contactColumn: {
        ...DEFAULT_FOOTER_CONFIG.contactColumn,
        ...(dbData?.contactColumn || {})
      },
      socialRow: {
        ...DEFAULT_FOOTER_CONFIG.socialRow,
        ...(dbData?.socialRow || {})
      },
      copyright: {
        ...DEFAULT_FOOTER_CONFIG.copyright,
        ...(dbData?.copyright || {})
      },
      spacing: {
        ...DEFAULT_FOOTER_CONFIG.spacing,
        ...(dbData?.spacing || {})
      },
      columns: Array.isArray(dbData?.columns) ? dbData.columns : DEFAULT_FOOTER_CONFIG.columns,
      paymentBadges: Array.isArray(dbData?.paymentBadges) ? dbData.paymentBadges : DEFAULT_FOOTER_CONFIG.paymentBadges,
    };
  };

  // Quick Action: Apply Font Family to all elements
  const handleApplyGlobalFont = (family: 'font-serif' | 'font-sans' | 'font-mono') => {
    setConfig(prev => {
      const updatedCols = prev.columns.map(col => ({
        ...col,
        titleFontFamily: family,
        linkFontFamily: family
      }));
      return {
        ...prev,
        globalFontFamily: family,
        appBlockTitleFontFamily: family,
        columns: updatedCols,
        contactColumn: {
          ...prev.contactColumn,
          titleFontFamily: family
        },
        socialRow: {
          ...prev.socialRow,
          labelFontFamily: family
        }
      };
    });
  };

  // Quick Action: Apply Color to all text elements
  const handleApplyGlobalColor = (hexColor: string) => {
    setConfig(prev => {
      const updatedCols = prev.columns.map(col => ({
        ...col,
        titleColor: '#ffffff', // keep title white or high contrast
        linkColor: hexColor
      }));
      return {
        ...prev,
        globalTextColor: hexColor,
        columns: updatedCols,
        contactColumn: {
          ...prev.contactColumn,
          titleColor: '#ffffff'
        },
        socialRow: {
          ...prev.socialRow,
          labelColor: '#ffffff'
        }
      };
    });
  };

  // Array reordering utility
  const moveInArray = (arr: any[], index: number, direction: 'up' | 'down') => {
    const nextArr = [...arr];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return arr;
    const temp = nextArr[index];
    nextArr[index] = nextArr[target];
    nextArr[target] = temp;
    return nextArr;
  };

  // Save changes handler
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('website_footer_settings', JSON.stringify(config));

      if (isFirebaseConfigured && db) {
        const docRef = doc(db, 'websiteSettings', 'footer');
        await setDoc(docRef, config, { merge: true });
      }

      setSavedConfig(config);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('idle');
      alert('Could not save custom footer schema. Please verify configurations.');
    }
  };

  // Reset handler
  const handleReset = () => {
    setResetStatus('resetting');
    setTimeout(() => {
      setConfig(savedConfig);
      setResetStatus('done');
      setTimeout(() => setResetStatus('idle'), 1500);
    }, 400);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-stone-400 gap-3 bg-stone-950 h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs uppercase tracking-widest font-mono font-bold">Bootstrapping Showroom Designer...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-950 text-stone-100 font-sans" id="admin-footer-root">
      
      {/* 1. TOP DOCK BAR */}
      <div className="bg-stone-900 border-b border-stone-800/80 p-4 sticky top-0 z-40 backdrop-blur flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-center text-amber-500">
            <Paintbrush className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[9px] text-stone-500 font-bold tracking-widest uppercase">
              <span>Admin Panel</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-amber-500">Interactive Footer Customizer</span>
            </div>
            <h2 className="text-sm font-serif font-bold text-stone-100 tracking-wide">
              Advanced Site-wide Footer Builder
            </h2>
          </div>
        </div>

        {/* Viewport resizing tools */}
        <div className="flex items-center bg-stone-950 p-1 border border-stone-800 rounded">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 rounded transition-all cursor-pointer ${
              viewportMode === 'desktop' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 rounded transition-all cursor-pointer ${
              viewportMode === 'tablet' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 rounded transition-all cursor-pointer ${
              viewportMode === 'mobile' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Sync trigger buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={resetStatus === 'resetting'}
            className="inline-flex h-9 px-4 items-center gap-2 border border-stone-800 hover:border-stone-700 bg-stone-900 text-stone-400 hover:text-stone-100 text-xs font-bold tracking-wider uppercase rounded transition-all disabled:opacity-30 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetStatus === 'resetting' ? 'animate-spin' : ''}`} />
            <span>{resetStatus === 'done' ? 'Reset Done!' : 'Reset'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`inline-flex h-9 px-5 items-center gap-2 text-xs font-bold tracking-wider uppercase rounded transition-all duration-300 shadow-md cursor-pointer ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 text-stone-100 border border-emerald-500'
                : 'bg-amber-500 hover:bg-amber-600 text-stone-950 border border-amber-400'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved Live!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT CONTAINER */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative" id="builder-workspace">
        
        {/* LEFT WORKSPACE: Preview Canvas with device container */}
        <div className="flex-1 bg-stone-900/60 overflow-y-auto p-4 md:p-8 flex flex-col relative" id="preview-col">
          
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-800 pb-3 shrink-0">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Real-time High Fidelity Preview</span>
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5 font-sans">
                Check responsive wrapping, gold contours, and stacked Mobile layout accordions in real-time.
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative min-h-[450px]">
            <div 
              className={`w-full transition-all duration-300 border border-dashed border-stone-700/60 rounded-lg bg-stone-950 overflow-hidden relative shadow-2xl ${
                viewportMode === 'mobile' ? 'max-w-[375px]' : viewportMode === 'tablet' ? 'max-w-[768px]' : 'max-w-full'
              }`}
            >
              {/* Virtual Device Frame header */}
              <div className="bg-stone-900 border-b border-stone-800/80 py-1.5 px-3 flex items-center justify-between text-[9px] text-stone-500 font-mono select-none">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-700" />
                  <span>PARASMONI LIVE VIEWPORT — {viewportMode.toUpperCase()}</span>
                </span>
                <span>{viewportMode === 'mobile' ? '375 × 812 PX (TAP TARGETS Vetted)' : viewportMode === 'tablet' ? '768 × 1024 PX' : 'FLUID RESPONSIVE'}</span>
              </div>

              {/* Fake web above */}
              <div className="py-14 px-8 text-center bg-stone-950 select-none pointer-events-none opacity-20 border-b border-stone-900">
                <span className="font-serif text-lg tracking-widest block text-gold-400 uppercase">PARASMONI JEWELLERS</span>
                <span className="text-[10px] uppercase font-mono tracking-widest block text-stone-500 mt-1">BOWBAZAR Heritage Showroom • Live Visual Canvas Simulator</span>
              </div>

              {/* Actual LIVE rendered dynamic footer */}
              <div className="relative">
                <Footer 
                  isBuilder={true} 
                  customConfig={config}
                  onFooterClick={() => setIsPanelOpen(true)}
                />
              </div>

            </div>
          </div>

          {/* Floating trigger button to open panel when closed */}
          {!isPanelOpen && (
            <div className="absolute bottom-6 right-6 z-40 animate-fade-in">
              <button
                onClick={() => setIsPanelOpen(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold uppercase tracking-widest text-xs px-5 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Open Footer Edit Panel</span>
              </button>
            </div>
          )}

        </div>

        {/* RIGHT WORKSPACE: Massive custom visual options scrolling panel */}
        <div className={`border-t lg:border-t-0 lg:border-l border-stone-800 bg-stone-900/95 flex flex-col transition-all duration-300 shrink-0 ${
          isPanelOpen ? 'w-full lg:w-[460px] h-auto lg:h-full opacity-100 visible' : 'w-0 h-0 lg:h-full opacity-0 invisible overflow-hidden border-l-0'
        }`}>
          
          {/* Panel title & close button */}
          <div className="bg-stone-950 border-b border-stone-800 px-4 py-3 shrink-0 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 animate-pulse" />
              <span>Footer Customizer Options</span>
            </span>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section Tab Headers */}
          <div className="bg-stone-950 border-b border-stone-800 p-2 shrink-0 overflow-x-auto flex gap-1 scrollbar-thin">
            {(['global', 'brand', 'links', 'contact', 'social', 'badges', 'legal'] as TabId[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab contents wrapper */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* TAB 1: Global and Spacing settings */}
            {activeTab === 'global' && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 bg-amber-500/5 rounded border border-amber-500/20 text-xs space-y-1.5">
                  <h4 className="font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Global Alignment & Spacing</span>
                  </h4>
                  <p className="text-stone-400 leading-relaxed font-sans">
                    Apply standardized fonts, base text colors, and adjust spacing parameters to provide ample breathing room.
                  </p>
                </div>

                {/* Background color settings */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={config.backgroundColor} 
                      onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-10 h-10 rounded border border-stone-800 bg-transparent cursor-pointer p-0"
                    />
                    <input 
                      type="text" 
                      value={config.backgroundColor} 
                      onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs font-mono text-stone-100 uppercase"
                    />
                  </div>
                </div>

                {/* Global Text color */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Global Link / Text Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={config.globalTextColor} 
                      onChange={(e) => handleApplyGlobalColor(e.target.value)}
                      className="w-10 h-10 rounded border border-stone-800 bg-transparent cursor-pointer p-0"
                    />
                    <input 
                      type="text" 
                      value={config.globalTextColor} 
                      onChange={(e) => handleApplyGlobalColor(e.target.value)}
                      className="flex-1 bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs font-mono text-stone-100 uppercase"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 font-sans">
                    Adjusts base link and text color across the entire footer at once (quick-action sync).
                  </p>
                </div>

                {/* Global font style */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Global Font Family</label>
                  <select
                    value={config.globalFontFamily}
                    onChange={(e) => handleApplyGlobalFont(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs font-medium text-stone-200"
                  >
                    <option value="font-sans">Modern Sans-Serif (Plus Jakarta Sans)</option>
                    <option value="font-serif">Heritage Elegant Serif (Playfair Display)</option>
                    <option value="font-mono">Fine Monospace (Technical)</option>
                  </select>
                </div>

                {/* Custom Border & Shape Customizer */}
                <div className="p-4 bg-stone-950 rounded border border-stone-800 space-y-4">
                  <h4 className="text-[11px] font-bold text-stone-300 uppercase tracking-widest border-b border-stone-900 pb-2 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>Border & Arch Shape Customizer</span>
                  </h4>

                  {/* Bottom Flat Edge Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-stone-300">Flat Bottom Edge</span>
                      <span className="block text-[10px] text-stone-500 font-sans mt-0.5">Removes bottom curved arches (top stays curved).</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={config.bottomFlat ?? true}
                      onChange={(e) => setConfig(prev => ({ ...prev, bottomFlat: e.target.checked }))}
                      className="w-4 h-4 text-amber-500 rounded border-stone-800 bg-stone-950 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Border Color */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Gold/Yellow Border Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={config.borderColor || '#b58b37'} 
                        onChange={(e) => setConfig(prev => ({ ...prev, borderColor: e.target.value }))}
                        className="w-8 h-8 rounded border border-stone-800 bg-transparent cursor-pointer p-0"
                      />
                      <input 
                        type="text" 
                        value={config.borderColor || '#b58b37'} 
                        onChange={(e) => setConfig(prev => ({ ...prev, borderColor: e.target.value }))}
                        className="flex-1 bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs font-mono text-stone-200 uppercase"
                      />
                    </div>
                  </div>

                  {/* Border Thickness */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Border Line Thickness</label>
                      <span className="text-[10px] font-mono font-bold text-amber-500 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                        {config.borderThickness ?? 4}px
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      value={config.borderThickness ?? 4}
                      onChange={(e) => setConfig(prev => ({ ...prev, borderThickness: parseInt(e.target.value) }))}
                      className="w-full accent-amber-500 h-1.5 bg-stone-900 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Spacing adjustments to fix cramping issues */}
                <div className="p-4 bg-stone-950 rounded border border-stone-800 space-y-4">
                  <h4 className="text-[11px] font-bold text-stone-300 uppercase tracking-widest border-b border-stone-900 pb-2 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>Layout Breathing Space Scale</span>
                  </h4>

                  {/* Row spacing adjustment */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Row Spacing</label>
                    <select
                      value={config.spacing.rowSpacing}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        spacing: { ...prev.spacing, rowSpacing: e.target.value }
                      }))}
                      className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-300"
                    >
                      <option value="space-y-6">Cramped / Compressed (6 units)</option>
                      <option value="space-y-10 md:space-y-12">Balanced / Normal (12 units)</option>
                      <option value="space-y-12 md:space-y-16">Generous / Loose (16 units - Vetted)</option>
                      <option value="space-y-16 md:space-y-20">Luxurious / Airy (20 units)</option>
                    </select>
                  </div>

                  {/* Column spacing */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Column Spacing</label>
                    <select
                      value={config.spacing.columnGap}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        spacing: { ...prev.spacing, columnGap: e.target.value }
                      }))}
                      className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-300"
                    >
                      <option value="gap-6">Tight (6 units)</option>
                      <option value="gap-10 md:gap-14">Moderate (14 units)</option>
                      <option value="gap-12 md:gap-16 lg:gap-24">Vetted Spacious (24 units - Recommended)</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: Brand and App block customizer */}
            {activeTab === 'brand' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Toggle block */}
                <div className="flex items-center justify-between p-3.5 bg-stone-950 rounded border border-stone-800">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-stone-200">App Download Block</span>
                    <span className="block text-[10px] text-stone-500 font-sans mt-0.5">Toggle showroom application section on/off.</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={config.showAppBlock}
                    onChange={(e) => setConfig(prev => ({ ...prev, showAppBlock: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded border-stone-800 bg-stone-950 focus:ring-amber-500"
                  />
                </div>

                {config.showAppBlock && (
                  <div className="space-y-5">
                    {/* App Block Title */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">App Section Title</label>
                      <input 
                        type="text" 
                        value={config.appBlockTitle}
                        onChange={(e) => setConfig(prev => ({ ...prev, appBlockTitle: e.target.value }))}
                        className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-100"
                      />
                    </div>

                    {/* App Title Custom Overrides */}
                    <div className="grid grid-cols-2 gap-3 bg-stone-950/40 p-3 rounded border border-stone-800/60">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 mb-1.5">Title Font</label>
                        <select
                          value={config.appBlockTitleFontFamily}
                          onChange={(e) => setConfig(prev => ({ ...prev, appBlockTitleFontFamily: e.target.value as any }))}
                          className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-300"
                        >
                          <option value="font-serif">Elegant Serif</option>
                          <option value="font-sans">Modern Sans</option>
                          <option value="font-mono">Monospace</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 mb-1.5">Title Size</label>
                        <select
                          value={config.appBlockTitleFontSize}
                          onChange={(e) => setConfig(prev => ({ ...prev, appBlockTitleFontSize: e.target.value }))}
                          className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-300"
                        >
                          <option value="text-[10px]">Tiny (10px)</option>
                          <option value="text-xs">Extra Small</option>
                          <option value="text-sm">Small</option>
                          <option value="text-base">Base (Normal)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 mb-1">Title Color</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={config.appBlockTitleColor || '#f59e0b'}
                            onChange={(e) => setConfig(prev => ({ ...prev, appBlockTitleColor: e.target.value }))}
                            className="w-8 h-8 rounded border border-stone-800"
                          />
                          <input 
                            type="text" 
                            value={config.appBlockTitleColor || '#f59e0b'}
                            onChange={(e) => setConfig(prev => ({ ...prev, appBlockTitleColor: e.target.value }))}
                            className="flex-1 bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo override */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Custom Brand Logo (Override)</label>
                      <ImageUploader 
                        id="custom-footer-logo-uploader"
                        value={config.logoUrl || ''}
                        onChange={(val) => setConfig(prev => ({ ...prev, logoUrl: val as string }))}
                      />
                      <p className="text-[9px] text-stone-500 font-sans">
                        Leave blank to automatically inherit the global showroom logo from settings.
                      </p>
                    </div>

                    {/* QR Code image */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">QR Code Image</label>
                      <ImageUploader 
                        id="footer-qr-code"
                        value={config.qrCodeUrl}
                        onChange={(val) => setConfig(prev => ({ ...prev, qrCodeUrl: val as string }))}
                      />
                    </div>

                    {/* App Links and Badges */}
                    <div className="p-4 bg-stone-950 rounded border border-stone-800 space-y-4">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Store URLs & Badges</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">Play Store App Listing Link</label>
                          <input 
                            type="text"
                            value={config.playStoreLink}
                            onChange={(e) => setConfig(prev => ({ ...prev, playStoreLink: e.target.value }))}
                            className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-100 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">Play Store Badge Image</label>
                          <ImageUploader 
                            id="playstore-badge"
                            value={config.playStoreBadgeUrl}
                            onChange={(val) => setConfig(prev => ({ ...prev, playStoreBadgeUrl: val as string }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-stone-900">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">App Store Listing Link</label>
                          <input 
                            type="text"
                            value={config.appStoreLink}
                            onChange={(e) => setConfig(prev => ({ ...prev, appStoreLink: e.target.value }))}
                            className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-100 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">App Store Badge Image</label>
                          <ImageUploader 
                            id="appstore-badge"
                            value={config.appStoreBadgeUrl}
                            onChange={(val) => setConfig(prev => ({ ...prev, appStoreBadgeUrl: val as string }))}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* TAB 3: Multi-column Link lists */}
            {activeTab === 'links' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Manage Columns header */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Link Columns list</label>
                  <button
                    onClick={() => {
                      const newId = `col-${Date.now()}`;
                      const newCol: LinkColumn = {
                        id: newId,
                        title: 'New Navigation',
                        links: [{ id: `link-${Date.now()}`, label: 'New Link Item', url: '/' }]
                      };
                      setConfig(prev => ({
                        ...prev,
                        columns: [...prev.columns, newCol]
                      }));
                      setSelectedColumnId(newId);
                    }}
                    className="inline-flex h-7 px-2.5 items-center gap-1 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 text-amber-500 text-[10px] font-bold tracking-wider uppercase rounded transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Column</span>
                  </button>
                </div>

                {/* Column stack lists */}
                <div className="space-y-3">
                  {config.columns.map((column, colIdx) => {
                    const isSelected = selectedColumnId === column.id;
                    return (
                      <div 
                        key={column.id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isSelected ? 'bg-stone-950 border-amber-500/60 shadow-lg' : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => setSelectedColumnId(isSelected ? null : column.id)}
                            className="flex-1 text-left font-serif font-bold text-xs text-stone-100 flex items-center gap-2 cursor-pointer"
                          >
                            <span>{column.title || 'Untitled column'}</span>
                            <span className="text-[10px] text-stone-500 font-mono font-medium font-sans">({column.links.length} Links)</span>
                          </button>

                          {/* Action controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Reordering */}
                            <button
                              disabled={colIdx === 0}
                              onClick={() => setConfig(prev => ({ ...prev, columns: moveInArray(prev.columns, colIdx, 'up') }))}
                              className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={colIdx === config.columns.length - 1}
                              onClick={() => setConfig(prev => ({ ...prev, columns: moveInArray(prev.columns, colIdx, 'down') }))}
                              className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {/* Deletion */}
                            <button
                              onClick={() => {
                                if (confirm(`Remove column "${column.title}" completely?`)) {
                                  setConfig(prev => ({
                                    ...prev,
                                    columns: prev.columns.filter(c => c.id !== column.id)
                                  }));
                                  setSelectedColumnId(null);
                                }
                              }}
                              className="p-1 text-stone-500 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete Column"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* If Column details editing open */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-stone-900 space-y-4">
                            {/* Edit Column Title */}
                            <div className="space-y-1.5">
                              <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold">Column Heading Text</label>
                              <input 
                                type="text"
                                value={column.title}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setConfig(prev => ({
                                    ...prev,
                                    columns: prev.columns.map(c => c.id === column.id ? { ...c, title: text } : c)
                                  }));
                                }}
                                className="w-full bg-stone-900 border border-stone-850 rounded px-2.5 py-1.5 text-xs text-stone-100"
                              />
                            </div>

                            {/* Column Font Style Overrides */}
                            <div className="grid grid-cols-2 gap-2 bg-stone-900/40 p-2.5 rounded border border-stone-850/60">
                              <div>
                                <label className="block text-[8px] uppercase tracking-wider text-stone-400 mb-1">Heading Font</label>
                                <select
                                  value={column.titleFontFamily || 'font-serif'}
                                  onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    columns: prev.columns.map(c => c.id === column.id ? { ...c, titleFontFamily: e.target.value as any } : c)
                                  }))}
                                  className="w-full bg-stone-950 border border-stone-850 rounded px-2 py-1 text-[10px] text-stone-300"
                                >
                                  <option value="font-serif">Elegant Serif</option>
                                  <option value="font-sans">Modern Sans</option>
                                  <option value="font-mono">Monospace</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] uppercase tracking-wider text-stone-400 mb-1">Link Font</label>
                                <select
                                  value={column.linkFontFamily || 'font-sans'}
                                  onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    columns: prev.columns.map(c => c.id === column.id ? { ...c, linkFontFamily: e.target.value as any } : c)
                                  }))}
                                  className="w-full bg-stone-950 border border-stone-850 rounded px-2 py-1 text-[10px] text-stone-300"
                                >
                                  <option value="font-serif">Elegant Serif</option>
                                  <option value="font-sans">Modern Sans</option>
                                  <option value="font-mono">Monospace</option>
                                </select>
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[8px] uppercase tracking-wider text-stone-400 mb-1">Links Text Override Color</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="color"
                                    value={column.linkColor || config.globalTextColor}
                                    onChange={(e) => {
                                      const color = e.target.value;
                                      setConfig(prev => ({
                                        ...prev,
                                        columns: prev.columns.map(c => c.id === column.id ? { ...c, linkColor: color } : c)
                                      }));
                                    }}
                                    className="w-7 h-7 rounded border border-stone-800"
                                  />
                                  <input 
                                    type="text"
                                    value={column.linkColor || config.globalTextColor}
                                    onChange={(e) => {
                                      const color = e.target.value;
                                      setConfig(prev => ({
                                        ...prev,
                                        columns: prev.columns.map(c => c.id === column.id ? { ...c, linkColor: color } : c)
                                      }));
                                    }}
                                    className="flex-1 bg-stone-950 border border-stone-850 rounded px-2 py-0.5 text-[10px] font-mono uppercase"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Column link list items */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b border-stone-900 pb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Links inside Column</span>
                                <button
                                  onClick={() => {
                                    const newLink: FooterLink = {
                                      id: `link-${Date.now()}`,
                                      label: 'New Link',
                                      url: '/'
                                    };
                                    setConfig(prev => ({
                                      ...prev,
                                      columns: prev.columns.map(c => c.id === column.id ? { ...c, links: [...c.links, newLink] } : c)
                                    }));
                                  }}
                                  className="inline-flex items-center gap-1 text-[9px] text-amber-500 font-bold uppercase cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Link</span>
                                </button>
                              </div>

                              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                                {column.links.map((link, linkIdx) => (
                                  <div key={link.id} className="p-2.5 bg-stone-900 rounded border border-stone-850 space-y-2">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="text-[9px] uppercase font-mono text-stone-500 font-bold">LINK #{linkIdx + 1}</span>
                                      
                                      <div className="flex items-center gap-1 shrink-0">
                                        {/* Reorder links */}
                                        <button
                                          disabled={linkIdx === 0}
                                          onClick={() => setConfig(prev => ({
                                            ...prev,
                                            columns: prev.columns.map(c => c.id === column.id ? { ...c, links: moveInArray(c.links, linkIdx, 'up') } : c)
                                          }))}
                                          className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-25"
                                        >
                                          <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          disabled={linkIdx === column.links.length - 1}
                                          onClick={() => setConfig(prev => ({
                                            ...prev,
                                            columns: prev.columns.map(c => c.id === column.id ? { ...c, links: moveInArray(c.links, linkIdx, 'down') } : c)
                                          }))}
                                          className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-25"
                                        >
                                          <ArrowDown className="w-3 h-3" />
                                        </button>
                                        {/* Delete link */}
                                        <button
                                          onClick={() => {
                                            setConfig(prev => ({
                                              ...prev,
                                              columns: prev.columns.map(c => c.id === column.id ? {
                                                ...c,
                                                links: c.links.filter(l => l.id !== link.id)
                                              } : c)
                                            }));
                                          }}
                                          className="p-0.5 text-stone-500 hover:text-rose-500"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Label Input */}
                                    <div>
                                      <label className="block text-[8px] uppercase text-stone-500 mb-0.5">Label</label>
                                      <input 
                                        type="text"
                                        value={link.label}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setConfig(prev => ({
                                            ...prev,
                                            columns: prev.columns.map(c => c.id === column.id ? {
                                              ...c,
                                              links: c.links.map(l => l.id === link.id ? { ...l, label: val } : l)
                                            } : c)
                                          }));
                                        }}
                                        className="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1 text-[11px] text-stone-200 focus:border-amber-500 focus:outline-none"
                                      />
                                    </div>

                                    {/* URL Picker (SmartLinkPicker) */}
                                    <div>
                                      <label className="block text-[8px] uppercase text-stone-500 mb-1">Destination Link</label>
                                      <SmartLinkPicker 
                                        value={link.url}
                                        onChange={(val) => {
                                          const targetUrl = typeof val === 'string' ? val : (val?.url || '/');
                                          setConfig(prev => ({
                                            ...prev,
                                            columns: prev.columns.map(c => c.id === column.id ? {
                                              ...c,
                                              links: c.links.map(l => l.id === link.id ? { ...l, url: targetUrl } : l)
                                            } : c)
                                          }));
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 4: Contact Us Column details */}
            {activeTab === 'contact' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Contact Title */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Contact Section Title</label>
                  <input 
                    type="text" 
                    value={config.contactColumn.title}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      contactColumn: { ...prev.contactColumn, title: e.target.value }
                    }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-100"
                  />
                </div>

                {/* Primary Contact number override details */}
                <div className="p-4 bg-stone-950 rounded border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-stone-200">Phone Number Override</span>
                      <span className="block text-[10px] text-stone-500 font-sans mt-0.5">Use custom footer-specific contact line.</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={config.contactColumn.primaryPhoneOverride}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        contactColumn: { ...prev.contactColumn, primaryPhoneOverride: e.target.checked }
                      }))}
                      className="w-4 h-4 text-amber-500 rounded border-stone-800 bg-stone-950 focus:ring-amber-500"
                    />
                  </div>

                  {config.contactColumn.primaryPhoneOverride && (
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase text-stone-400 font-semibold">Primary Contact Number</label>
                      <input 
                        type="text"
                        value={config.contactColumn.primaryPhone}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          contactColumn: { ...prev.contactColumn, primaryPhone: e.target.value }
                        }))}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-100 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Chat/Message Contact block */}
                <div className="p-4 bg-stone-950 rounded border border-stone-800 space-y-3.5">
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Secondary Contact Line (WhatsApp)</h4>
                  
                  <div className="space-y-2">
                    <label className="block text-[9px] uppercase tracking-wider text-stone-500">Contact Line Label</label>
                    <input 
                      type="text"
                      value={config.contactColumn.chatWithUsLabel}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        contactColumn: { ...prev.contactColumn, chatWithUsLabel: e.target.value }
                      }))}
                      className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] uppercase tracking-wider text-stone-500">Phone/WhatsApp Value</label>
                    <input 
                      type="text"
                      value={config.contactColumn.secondaryPhone}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        contactColumn: { ...prev.contactColumn, secondaryPhone: e.target.value }
                      }))}
                      className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-100 font-mono"
                    />
                  </div>
                </div>

                {/* Contact Action Circular Icons */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Circular Contact Buttons</label>
                    <button
                      onClick={() => {
                        const newIcon: ContactIcon = {
                          id: `co-${Date.now()}`,
                          type: 'custom',
                          label: 'Custom Icon',
                          url: '',
                          useCustomIcon: false
                        };
                        setConfig(prev => ({
                          ...prev,
                          contactColumn: {
                            ...prev.contactColumn,
                            icons: [...prev.contactColumn.icons, newIcon]
                          }
                        }));
                      }}
                      className="inline-flex h-6 px-2 items-center gap-1 bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 text-[10px] font-bold uppercase rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Button</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {config.contactColumn.icons.map((icon, iconIdx) => (
                      <div key={icon.id} className="p-3 bg-stone-950 rounded border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between gap-2 border-b border-stone-900 pb-2">
                          <span className="text-[9px] uppercase font-mono text-stone-500 font-bold">Icon Slot #{iconIdx + 1} ({icon.type.toUpperCase()})</span>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Reordering */}
                            <button
                              disabled={iconIdx === 0}
                              onClick={() => setConfig(prev => {
                                const list = moveInArray(prev.contactColumn.icons, iconIdx, 'up');
                                return { ...prev, contactColumn: { ...prev.contactColumn, icons: list } };
                              })}
                              className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={iconIdx === config.contactColumn.icons.length - 1}
                              onClick={() => setConfig(prev => {
                                const list = moveInArray(prev.contactColumn.icons, iconIdx, 'down');
                                return { ...prev, contactColumn: { ...prev.contactColumn, icons: list } };
                              })}
                              className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            {/* Deletion */}
                            <button
                              onClick={() => {
                                setConfig(prev => ({
                                  ...prev,
                                  contactColumn: {
                                    ...prev.contactColumn,
                                    icons: prev.contactColumn.icons.filter(i => i.id !== icon.id)
                                  }
                                }));
                              }}
                              className="p-0.5 text-stone-500 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Config Properties */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8px] uppercase text-stone-500 mb-1">Action Type</label>
                            <select
                              value={icon.type}
                              onChange={(e) => {
                                const t = e.target.value as any;
                                setConfig(prev => ({
                                  ...prev,
                                  contactColumn: {
                                    ...prev.contactColumn,
                                    icons: prev.contactColumn.icons.map(i => i.id === icon.id ? { ...i, type: t } : i)
                                  }
                                }));
                              }}
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-300"
                            >
                              <option value="whatsapp">WhatsApp</option>
                              <option value="email">Email Mailto</option>
                              <option value="chat">Enquiry Form / Link</option>
                              <option value="custom">Custom SVG Icon</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] uppercase text-stone-500 mb-1">Hover Title</label>
                            <input 
                              type="text"
                              value={icon.label}
                              onChange={(e) => {
                                const labelText = e.target.value;
                                setConfig(prev => ({
                                  ...prev,
                                  contactColumn: {
                                    ...prev.contactColumn,
                                    icons: prev.contactColumn.icons.map(i => i.id === icon.id ? { ...i, label: labelText } : i)
                                  }
                                }));
                              }}
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[8px] uppercase text-stone-500 mb-1">Custom Destination Link (Optional)</label>
                            <input 
                              type="text"
                              value={icon.url}
                              onChange={(e) => {
                                const urlText = e.target.value;
                                setConfig(prev => ({
                                  ...prev,
                                  contactColumn: {
                                    ...prev.contactColumn,
                                    icons: prev.contactColumn.icons.map(i => i.id === icon.id ? { ...i, url: urlText } : i)
                                  }
                                }));
                              }}
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-100 font-mono"
                              placeholder="e.g. mailto:xyz@gmail.com, or blank for automatic fallback"
                            />
                          </div>
                        </div>

                        {/* Custom SVG upload trigger/editor code */}
                        <div className="p-2.5 bg-stone-900 rounded border border-stone-850/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Use Custom SVG Vector</span>
                            <input 
                              type="checkbox"
                              checked={icon.useCustomIcon}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setConfig(prev => ({
                                  ...prev,
                                  contactColumn: {
                                    ...prev.contactColumn,
                                    icons: prev.contactColumn.icons.map(i => i.id === icon.id ? { ...i, useCustomIcon: checked } : i)
                                  }
                                }));
                              }}
                              className="w-3.5 h-3.5 text-amber-500 rounded border-stone-800 bg-stone-950 focus:ring-amber-500"
                            />
                          </div>

                          {icon.useCustomIcon && (
                            <div className="space-y-1.5">
                              <label className="block text-[8px] uppercase text-stone-500 flex items-center gap-1">
                                <Code className="w-3 h-3 text-amber-500" />
                                <span>Custom SVG Source Code</span>
                              </label>
                              <textarea
                                value={icon.customIconSvg || ''}
                                onChange={(e) => {
                                  const svg = e.target.value;
                                  setConfig(prev => ({
                                    ...prev,
                                    contactColumn: {
                                      ...prev.contactColumn,
                                      icons: prev.contactColumn.icons.map(i => i.id === icon.id ? { ...i, customIconSvg: svg } : i)
                                    }
                                  }));
                                }}
                                className="w-full h-16 bg-stone-950 border border-stone-850 rounded p-2 text-[10px] font-mono text-stone-300"
                                placeholder='<svg fill="currentColor" viewBox="0 0 24 24">...</svg>'
                              />
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: Social Platforms details */}
            {activeTab === 'social' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Social label */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Social Row Label</label>
                  <input 
                    type="text" 
                    value={config.socialRow.label}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      socialRow: { ...prev.socialRow, label: e.target.value }
                    }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-100"
                  />
                </div>

                {/* Grid of platforms */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-300 font-sans">Social Platforms</label>
                    <button
                      onClick={() => {
                        const newPlat: SocialPlatform = {
                          id: `so-${Date.now()}`,
                          type: 'custom',
                          url: 'https://',
                          useCustomIcon: false
                        };
                        setConfig(prev => ({
                          ...prev,
                          socialRow: {
                            ...prev.socialRow,
                            platforms: [...prev.socialRow.platforms, newPlat]
                          }
                        }));
                      }}
                      className="inline-flex h-6 px-2.5 items-center gap-1 bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 text-[10px] font-bold uppercase rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Platform</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {config.socialRow.platforms.map((platform, platIdx) => (
                      <div key={platform.id} className="p-3 bg-stone-950 rounded border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between gap-1.5 border-b border-stone-900 pb-1.5">
                          <span className="text-[9px] uppercase font-mono text-stone-500 font-bold">Platform #{platIdx + 1} ({platform.type.toUpperCase()})</span>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Reordering */}
                            <button
                              disabled={platIdx === 0}
                              onClick={() => setConfig(prev => {
                                const list = moveInArray(prev.socialRow.platforms, platIdx, 'up');
                                return { ...prev, socialRow: { ...prev.socialRow, platforms: list } };
                              })}
                              className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={platIdx === config.socialRow.platforms.length - 1}
                              onClick={() => setConfig(prev => {
                                const list = moveInArray(prev.socialRow.platforms, platIdx, 'down');
                                return { ...prev, socialRow: { ...prev.socialRow, platforms: list } };
                              })}
                              className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setConfig(prev => ({
                                  ...prev,
                                  socialRow: {
                                    ...prev.socialRow,
                                    platforms: prev.socialRow.platforms.filter(p => p.id !== platform.id)
                                  }
                                }));
                              }}
                              className="p-0.5 text-stone-500 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8px] uppercase text-stone-500 mb-1">Platform Preset</label>
                            <select
                              value={platform.type}
                              onChange={(e) => {
                                const typeValue = e.target.value as any;
                                setConfig(prev => ({
                                  ...prev,
                                  socialRow: {
                                    ...prev.socialRow,
                                    platforms: prev.socialRow.platforms.map(p => p.id === platform.id ? { ...p, type: typeValue } : p)
                                  }
                                }));
                              }}
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-300"
                            >
                              <option value="instagram">Instagram</option>
                              <option value="x">X / Twitter</option>
                              <option value="facebook">Facebook</option>
                              <option value="youtube">YouTube</option>
                              <option value="pinterest">Pinterest</option>
                              <option value="custom">Custom SVG</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[8px] uppercase text-stone-500 mb-1">Profile Link URL</label>
                            <input 
                              type="text"
                              value={platform.url}
                              onChange={(e) => {
                                const urlText = e.target.value;
                                setConfig(prev => ({
                                  ...prev,
                                  socialRow: {
                                    ...prev.socialRow,
                                    platforms: prev.socialRow.platforms.map(p => p.id === platform.id ? { ...p, url: urlText } : p)
                                  }
                                }));
                              }}
                              className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-100 font-mono"
                            />
                          </div>
                        </div>

                        {/* Custom SVG Icon markup toggle */}
                        <div className="p-2 bg-stone-900 rounded border border-stone-850/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Use Custom SVG</span>
                            <input 
                              type="checkbox"
                              checked={platform.useCustomIcon}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setConfig(prev => ({
                                  ...prev,
                                  socialRow: {
                                    ...prev.socialRow,
                                    platforms: prev.socialRow.platforms.map(p => p.id === platform.id ? { ...p, useCustomIcon: checked } : p)
                                  }
                                }));
                              }}
                              className="w-3.5 h-3.5 text-amber-500 rounded border-stone-800 bg-stone-950 focus:ring-amber-500"
                            />
                          </div>

                          {platform.useCustomIcon && (
                            <div className="space-y-1">
                              <label className="block text-[8px] uppercase text-stone-500 flex items-center gap-1">
                                <Code className="w-3 h-3 text-amber-500" />
                                <span>Paste SVG Tag Code</span>
                              </label>
                              <textarea
                                value={platform.customIconSvg || ''}
                                onChange={(e) => {
                                  const svg = e.target.value;
                                  setConfig(prev => ({
                                    ...prev,
                                    socialRow: {
                                      ...prev.socialRow,
                                      platforms: prev.socialRow.platforms.map(p => p.id === platform.id ? { ...p, customIconSvg: svg } : p)
                                    }
                                  }));
                                }}
                                className="w-full h-16 bg-stone-950 border border-stone-850 rounded p-1.5 text-[10px] font-mono text-stone-300"
                                placeholder='<svg viewBox="0 0 24 24">...</svg>'
                              />
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 6: Payment trust badges */}
            {activeTab === 'badges' && (
              <div className="space-y-6 animate-fade-in">
                
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Payment Trust Badges</label>
                  <button
                    onClick={() => {
                      const newBadge: PaymentBadge = {
                        id: `pay-${Date.now()}`,
                        name: 'New Badge',
                        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg'
                      };
                      setConfig(prev => ({
                        ...prev,
                        paymentBadges: [...prev.paymentBadges, newBadge]
                      }));
                    }}
                    className="inline-flex h-6 px-2.5 items-center gap-1 bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 text-[10px] font-bold uppercase rounded cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Badge</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {config.paymentBadges.map((badge, bIdx) => (
                    <div key={badge.id} className="p-3 bg-stone-950 rounded border border-stone-800 space-y-3">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] uppercase font-mono text-stone-500 font-bold">Badge #{bIdx + 1}: {badge.name}</span>
                        
                        <div className="flex items-center gap-1">
                          {/* Reordering */}
                          <button
                            disabled={bIdx === 0}
                            onClick={() => setConfig(prev => ({ ...prev, paymentBadges: moveInArray(prev.paymentBadges, bIdx, 'up') }))}
                            className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={bIdx === config.paymentBadges.length - 1}
                            onClick={() => setConfig(prev => ({ ...prev, paymentBadges: moveInArray(prev.paymentBadges, bIdx, 'down') }))}
                            className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          {/* Deletion */}
                          <button
                            onClick={() => {
                              setConfig(prev => ({
                                ...prev,
                                paymentBadges: prev.paymentBadges.filter(b => b.id !== badge.id)
                              }));
                            }}
                            className="p-0.5 text-stone-500 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Name input */}
                      <div className="grid grid-cols-3 gap-3 items-center">
                        <div className="col-span-2">
                          <label className="block text-[8px] uppercase text-stone-500 mb-0.5">Badge Name</label>
                          <input 
                            type="text"
                            value={badge.name}
                            onChange={(e) => {
                              const valueText = e.target.value;
                              setConfig(prev => ({
                                ...prev,
                                paymentBadges: prev.paymentBadges.map(b => b.id === badge.id ? { ...b, name: valueText } : b)
                              }));
                            }}
                            className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200"
                          />
                        </div>
                        <div className="h-10 border border-stone-800 bg-stone-900 rounded p-1 flex items-center justify-center select-none">
                          <img 
                            src={badge.imageUrl} 
                            alt={badge.name} 
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>

                      {/* Image uploader */}
                      <div className="space-y-1">
                        <label className="block text-[8px] uppercase text-stone-500">Badge Vector URL / Custom Image</label>
                        <ImageUploader 
                          id={`badge-img-${badge.id}`}
                          value={badge.imageUrl}
                          onChange={(val) => {
                            setConfig(prev => ({
                              ...prev,
                              paymentBadges: prev.paymentBadges.map(b => b.id === badge.id ? { ...b, imageUrl: val as string } : b)
                            }));
                          }}
                        />
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 7: Copyright & Legal links details */}
            {activeTab === 'legal' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Copyright Text */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Copyright Slogan Text</label>
                  <input 
                    type="text" 
                    value={config.copyright.text}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      copyright: { ...prev.copyright, text: e.target.value }
                    }))}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-3 py-2 text-xs text-stone-100"
                    placeholder="e.g. Parasmoni Jewellers & Brothers. All Rights Reserved."
                  />
                </div>

                {/* Real Auto-year vs static toggle */}
                <div className="p-4 bg-stone-950 rounded border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-stone-200">Automatically Sync Current Year</span>
                      <span className="block text-[10px] text-stone-500 font-sans mt-0.5">Toggle live year sync using client-side clocks.</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={config.copyright.autoYear}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        copyright: { ...prev.copyright, autoYear: e.target.checked }
                      }))}
                      className="w-4 h-4 text-amber-500 rounded border-stone-800 bg-stone-950 focus:ring-amber-500"
                    />
                  </div>

                  {!config.copyright.autoYear && (
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase text-stone-400 font-semibold">Static Year String</label>
                      <input 
                        type="text"
                        value={config.copyright.staticYear || '2026'}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          copyright: { ...prev.copyright, staticYear: e.target.value }
                        }))}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-1.5 text-xs text-stone-100 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Legal links managing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-300">Legal Bottom Links</label>
                    <button
                      onClick={() => {
                        const newLegal: FooterLink = {
                          id: `ll-${Date.now()}`,
                          label: 'New Policy',
                          url: '/'
                        };
                        setConfig(prev => ({
                          ...prev,
                          copyright: {
                            ...prev.copyright,
                            legalLinks: [...prev.copyright.legalLinks, newLegal]
                          }
                        }));
                      }}
                      className="inline-flex h-6 px-2.5 items-center gap-1 bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 text-[10px] font-bold uppercase rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Policy Link</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {config.copyright.legalLinks.map((link, legalIdx) => (
                      <div key={link.id} className="p-3 bg-stone-950 rounded border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] uppercase font-mono text-stone-500 font-bold">Policy #{legalIdx + 1}: {link.label}</span>
                          
                          <div className="flex items-center gap-1">
                            {/* Reordering */}
                            <button
                              disabled={legalIdx === 0}
                              onClick={() => setConfig(prev => {
                                const list = moveInArray(prev.copyright.legalLinks, legalIdx, 'up');
                                return { ...prev, copyright: { ...prev.copyright, legalLinks: list } };
                              })}
                              className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={legalIdx === config.copyright.legalLinks.length - 1}
                              onClick={() => setConfig(prev => {
                                const list = moveInArray(prev.copyright.legalLinks, legalIdx, 'down');
                                return { ...prev, copyright: { ...prev.copyright, legalLinks: list } };
                              })}
                              className="p-0.5 text-stone-500 hover:text-stone-300 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            {/* Deletion */}
                            <button
                              onClick={() => {
                                setConfig(prev => ({
                                  ...prev,
                                  copyright: {
                                    ...prev.copyright,
                                    legalLinks: prev.copyright.legalLinks.filter(l => l.id !== link.id)
                                  }
                                }));
                              }}
                              className="p-0.5 text-stone-500 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Label */}
                        <div className="space-y-1">
                          <label className="block text-[8px] uppercase text-stone-500">Link Label</label>
                          <input 
                            type="text"
                            value={link.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig(prev => ({
                                ...prev,
                                copyright: {
                                  ...prev.copyright,
                                  legalLinks: prev.copyright.legalLinks.map(l => l.id === link.id ? { ...l, label: val } : l)
                                }
                              }));
                            }}
                            className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-xs text-stone-200"
                          />
                        </div>

                        {/* SmartLinkPicker */}
                        <div className="space-y-1">
                          <label className="block text-[8px] uppercase text-stone-500">Destination URL</label>
                          <SmartLinkPicker 
                            value={link.url}
                            onChange={(val) => {
                              const targetUrl = typeof val === 'string' ? val : (val?.url || '/');
                              setConfig(prev => ({
                                ...prev,
                                copyright: {
                                  ...prev.copyright,
                                  legalLinks: prev.copyright.legalLinks.map(l => l.id === link.id ? { ...l, url: targetUrl } : l)
                                }
                              }));
                            }}
                          />
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Style indicator footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-[10px] text-stone-500 shrink-0 select-none">
            <span className="flex items-center gap-1.5 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${JSON.stringify(config) !== JSON.stringify(savedConfig) ? "bg-amber-500 animate-pulse" : "bg-stone-600"}`} />
              <span>DRAFT STAGED: {JSON.stringify(config) !== JSON.stringify(savedConfig) ? "YES" : "NO"}</span>
            </span>
            <span className="font-mono uppercase text-amber-500/80">{activeTab} panel</span>
          </div>

        </div>

      </div>

    </div>
  );
}
