/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Full Screen Mobile Intro Splash Video Component
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

const INTRO_VIDEO_URL = "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20(1)%20(1).mp4";

export function MobileSplashVideo(): React.JSX.Element | null {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Only execute for mobile view (screen width < 768px)
    const checkIsMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      // Show splash video if opened in mobile view
      if (isMobileWidth) {
        const alreadySeen = sessionStorage.getItem('parasmoni_mobile_splash_played');
        if (!alreadySeen) {
          setIsVisible(true);
        }
      }
    };

    checkIsMobile();

    const handleResize = () => {
      if (window.innerWidth >= 768 && isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay with audio blocked, falling back to muted autoplay:', err);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [isVisible]);

  const handleFinishVideo = () => {
    sessionStorage.setItem('parasmoni_mobile_splash_played', 'true');
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 600); // smooth 600ms fade transition
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-600 ease-out md:hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      id="mobile-splash-video-overlay"
    >
      {/* Full Screen Video Container */}
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL}
        className="w-full h-full object-cover select-none"
        autoPlay
        playsInline
        muted
        onEnded={handleFinishVideo}
        onClick={handleFinishVideo}
      />

      {/* Bottom Right White Chevron '>' Skip Button */}
      <div className="absolute bottom-8 right-6 z-10">
        <button
          type="button"
          onClick={handleFinishVideo}
          className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/60 text-white flex items-center justify-center shadow-2xl active:scale-90 hover:bg-white/30 transition-all cursor-pointer"
          aria-label="Skip Intro Video"
        >
          <ChevronRight className="w-7 h-7 text-white stroke-[2.8] ml-0.5" />
        </button>
      </div>
    </div>
  );
}
