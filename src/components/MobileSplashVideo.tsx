/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Mobile & Desktop Intro Splash Video with Instant Skip Button & Core Web Vitals Optimization
 */

import React, { useState, useEffect, useRef } from 'react';

const INTRO_MAX_MS = 5000;

const BASE_VIDEO_URL = "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20(1)%20(1).mp4";
const POSTER_IMAGE_URL = "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20(1)%20(1).mp4/ik-thumbnail.jpg?tr=w-720,q-60,f-auto";

export function MobileSplashVideo(): React.JSX.Element | null {
  // 1. Initial Session & Connection/Motion Checks
  const [shouldRender, setShouldRender] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    // Check if user already saw intro in current session
    try {
      if (sessionStorage.getItem('introSeen') === 'true') {
        return false;
      }
    } catch (e) {
      // Ignore sessionStorage exceptions
    }

    // Check prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }

    // Check saveData setting
    const nav = navigator as any;
    if (nav?.connection?.saveData === true) {
      return false;
    }

    return true;
  });

  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const skipBtnRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosedRef = useRef<boolean>(false);

  // Determine optimal video URL based on viewport width (Mobile w-480, Desktop w-960)
  const videoSrc = React.useMemo(() => {
    if (typeof window === 'undefined') return BASE_VIDEO_URL;
    const isMobileWidth = window.innerWidth < 768;
    return `${BASE_VIDEO_URL}?tr=${isMobileWidth ? 'w-480,q-55' : 'w-960,q-60'}`;
  }, []);

  const closeIntro = React.useCallback(() => {
    if (isClosedRef.current) return;
    isClosedRef.current = true;

    // Save introSeen in sessionStorage
    try {
      sessionStorage.setItem('introSeen', 'true');
    } catch (e) {
      // Ignore
    }

    // Clear auto-close timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Stop video download and pause
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch (e) {
        // Ignore
      }
    }

    // Restore body scroll
    document.body.style.overflow = '';

    // Fade out with 200ms transition
    setIsFadingOut(true);

    setTimeout(() => {
      setIsMounted(false);
      setShouldRender(false);

      // Move focus to main content
      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        mainEl.focus();
      }
    }, 200);
  }, []);

  useEffect(() => {
    if (!shouldRender || !isMounted) return;

    // Lock body scroll while intro is visible
    document.body.style.overflow = 'hidden';

    // Auto focus skip button on mount
    const focusTimer = setTimeout(() => {
      skipBtnRef.current?.focus();
    }, 10);

    // Set maximum duration timer
    timerRef.current = setTimeout(() => {
      closeIntro();
    }, INTRO_MAX_MS);

    // Handle Escape key listener
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

  if (!shouldRender || !isMounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introduction video"
      className={`fixed inset-0 z-[999999] bg-black flex items-center justify-center transition-opacity duration-200 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Instant Skip Button */}
      <button
        ref={skipBtnRef}
        type="button"
        aria-label="Skip intro video"
        onClick={closeIntro}
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
        className="fixed right-3 z-[1000000] flex items-center gap-1.5 min-w-[48px] min-h-[48px] px-4 py-2.5 bg-black/55 hover:bg-black/80 text-white font-medium text-xs tracking-wider uppercase rounded-full border border-white/60 shadow-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 transition-colors active:scale-95"
      >
        <span>Skip</span>
        {/* Inline SVG Skip Icon */}
        <svg
          className="w-4 h-4 fill-current text-white shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>

      {/* Intro Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={POSTER_IMAGE_URL}
        autoPlay
        muted
        playsInline
        preload="metadata"
        onEnded={closeIntro}
        onError={closeIntro}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
