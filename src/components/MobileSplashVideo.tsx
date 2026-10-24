/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Performance-Engineered Light Intro Splash Video Component
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const INTRO_ENABLED = true;
const INTRO_MAX_MS = 2500;

const BASE_VIDEO_URL = "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20(1)%20(1).mp4";
const POSTER_IMAGE_URL = "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20(1)%20(1).mp4/ik-thumbnail.jpg?tr=w-720,q-60,f-auto";

export function MobileSplashVideo(): React.JSX.Element | null {
  // 1. Local state only — never triggers parent App re-renders
  const [shouldRender, setShouldRender] = useState<boolean>(() => {
    if (!INTRO_ENABLED || typeof window === 'undefined') return false;

    // Session cache check
    try {
      if (sessionStorage.getItem('introSeen') === 'true') {
        return false;
      }
    } catch (e) {
      // Ignore
    }

    // Motion preference check
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }

    // Data-saver check
    const nav = navigator as any;
    if (nav?.connection?.saveData === true) {
      return false;
    }

    return true;
  });

  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const skipBtnRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosedRef = useRef<boolean>(false);

  // Single viewport-optimized URL chosen at mount (w-480 for mobile, w-960 for desktop)
  const videoSrc = useMemo(() => {
    if (typeof window === 'undefined') return BASE_VIDEO_URL;
    const isMobile = window.innerWidth < 768;
    return `${BASE_VIDEO_URL}?tr=${isMobile ? 'w-480,q-50' : 'w-960,q-55'}`;
  }, []);

  const closeIntro = useCallback(() => {
    if (isClosedRef.current) return;
    isClosedRef.current = true;

    // Save in sessionStorage
    try {
      sessionStorage.setItem('introSeen', 'true');
    } catch (e) {
      // Ignore
    }

    // Clear max timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Immediately stop video download and abort network stream
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch (e) {
        // Ignore
      }
    }

    // Restore scroll
    document.body.style.overflow = '';

    // Fast 200ms fadeout transition
    setIsFadingOut(true);

    setTimeout(() => {
      setIsMounted(false);
      setShouldRender(false);

      // Move focus to main element
      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        mainEl.focus();
      }
    }, 200);
  }, []);

  useEffect(() => {
    if (!shouldRender || !isMounted) return;

    // Prevent body scroll during overlay display
    document.body.style.overflow = 'hidden';

    // Auto-focus skip button for accessibility
    const focusTimer = setTimeout(() => {
      skipBtnRef.current?.focus();
    }, 10);

    // Hard cutoff timeout at INTRO_MAX_MS (2500ms)
    timerRef.current = setTimeout(() => {
      closeIntro();
    }, INTRO_MAX_MS);

    // Escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeIntro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [shouldRender, isMounted, closeIntro]);

  if (!INTRO_ENABLED || !shouldRender || !isMounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introduction video"
      className={`fixed inset-0 z-[999999] bg-stone-950 flex items-center justify-center transition-opacity duration-200 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Instant Poster Image (shown immediately — zero black flash) */}
      <img
        src={POSTER_IMAGE_URL}
        alt="Parasmoni Jewellers Intro"
        width={720}
        height={1280}
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* 2. Instant Skip Button (visible from frame 0) */}
      <button
        ref={skipBtnRef}
        type="button"
        aria-label="Skip intro video"
        onClick={closeIntro}
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
        className="fixed right-3 z-[1000000] flex items-center gap-1.5 min-w-[48px] min-h-[48px] px-4 py-2.5 bg-black/60 hover:bg-black/85 text-white font-semibold text-xs tracking-wider uppercase rounded-full border border-white/70 shadow-xl cursor-pointer focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 transition-colors active:scale-95"
      >
        <span>Skip</span>
        <svg
          className="w-4 h-4 fill-current text-white shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>

      {/* 3. Layered Video Element (fades in only when playing) */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={POSTER_IMAGE_URL}
        autoPlay
        muted
        playsInline
        preload="metadata"
        onPlaying={() => setIsVideoPlaying(true)}
        onEnded={closeIntro}
        onError={closeIntro}
        className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${
          isVideoPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
