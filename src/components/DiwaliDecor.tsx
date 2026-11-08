/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers & Brothers - Festive Diwali Overlay
 *
 * Single switch to enable/disable all Diwali decorations after the festival:
 */
export const SHOW_DIWALI_DECOR = true;

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';

/**
 * Optimized SVG data URIs for repeating toran layers:
 * Swag repeat width: 120px on desktop (height 44px), 84px on mobile (height 34px).
 * Layer 1: Static golden wire + marigold tassels at junctions.
 * Layers 2, 3, 4: 5 teardrop bulbs per swag split into 3 groups for shimmering wave.
 */
const WIRE_TASSEL_SVG_DESKTOP = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44" viewBox="0 0 120 44" fill="none">
  <!-- Soft sagging catenary curve wire -->
  <path d="M 0,2 Q 60,30 120,2" stroke="#C58B3A" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <!-- Marigold tassel at junction (x=0/120) -->
  <g transform="translate(0, 2)">
    <line x1="0" y1="0" x2="0" y2="14" stroke="#6C8330" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M 0,6 Q 3,4 4,7 Q 1,8 0,6" fill="#4E6B1F"/>
    <circle cx="0" cy="18" r="4.8" fill="#FF8A00"/>
    <circle cx="0" cy="18" r="3.2" fill="#FFA500"/>
    <circle cx="0" cy="18" r="1.8" fill="#FFC21A"/>
  </g>
  <g transform="translate(120, 2)">
    <line x1="0" y1="0" x2="0" y2="14" stroke="#6C8330" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M 0,6 Q 3,4 4,7 Q 1,8 0,6" fill="#4E6B1F"/>
    <circle cx="0" cy="18" r="4.8" fill="#FF8A00"/>
    <circle cx="0" cy="18" r="3.2" fill="#FFA500"/>
    <circle cx="0" cy="18" r="1.8" fill="#FFC21A"/>
  </g>
</svg>
`)}`;

const WIRE_TASSEL_SVG_MOBILE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="84" height="34" viewBox="0 0 84 34" fill="none">
  <path d="M 0,2 Q 42,24 84,2" stroke="#C58B3A" stroke-width="1" fill="none" stroke-linecap="round"/>
  <g transform="translate(0, 2)">
    <line x1="0" y1="0" x2="0" y2="10" stroke="#6C8330" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="0" cy="14" r="3.8" fill="#FF8A00"/>
    <circle cx="0" cy="14" r="2.5" fill="#FFA500"/>
    <circle cx="0" cy="14" r="1.4" fill="#FFC21A"/>
  </g>
  <g transform="translate(84, 2)">
    <line x1="0" y1="0" x2="0" y2="10" stroke="#6C8330" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="0" cy="14" r="3.8" fill="#FF8A00"/>
    <circle cx="0" cy="14" r="2.5" fill="#FFA500"/>
    <circle cx="0" cy="14" r="1.4" fill="#FFC21A"/>
  </g>
</svg>
`)}`;

// Bulb groups 1, 2, 3 on Desktop (swag width 120, bulbs at x=20, 40, 60, 80, 100)
const BULBS_G1_DESKTOP = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44" viewBox="0 0 120 44" fill="none">
  <defs>
    <radialGradient id="g1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF9A3C" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#FF8A00" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#FF7A00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Bulb 1 (x=20, y=9) -->
  <g transform="translate(20, 9)">
    <circle cx="0" cy="4" r="13" fill="url(#g1)"/>
    <rect x="-0.8" y="0" width="1.6" height="2" fill="#5A3A10"/>
    <path d="M 0,2 C -3,4 -3,7 0,9 C 3,7 3,4 0,2 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="5.5" rx="1.5" ry="2.2" fill="#FFE9A8"/>
  </g>
</svg>
`)}`;

const BULBS_G2_DESKTOP = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44" viewBox="0 0 120 44" fill="none">
  <defs>
    <radialGradient id="g2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF9A3C" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#FF8A00" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#FF7A00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Bulb 2 (x=40, y=14.5) & Bulb 4 (x=80, y=14.5) -->
  <g transform="translate(40, 14.5)">
    <circle cx="0" cy="4" r="13" fill="url(#g2)"/>
    <rect x="-0.8" y="0" width="1.6" height="2" fill="#5A3A10"/>
    <path d="M 0,2 C -3,4 -3,7 0,9 C 3,7 3,4 0,2 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="5.5" rx="1.5" ry="2.2" fill="#FFE9A8"/>
  </g>
  <g transform="translate(80, 14.5)">
    <circle cx="0" cy="4" r="13" fill="url(#g2)"/>
    <rect x="-0.8" y="0" width="1.6" height="2" fill="#5A3A10"/>
    <path d="M 0,2 C -3,4 -3,7 0,9 C 3,7 3,4 0,2 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="5.5" rx="1.5" ry="2.2" fill="#FFE9A8"/>
  </g>
</svg>
`)}`;

const BULBS_G3_DESKTOP = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44" viewBox="0 0 120 44" fill="none">
  <defs>
    <radialGradient id="g3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF9A3C" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#FF8A00" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#FF7A00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Bulb 3 (x=60, y=16) & Bulb 5 (x=100, y=9) -->
  <g transform="translate(60, 16)">
    <circle cx="0" cy="4" r="13" fill="url(#g3)"/>
    <rect x="-0.8" y="0" width="1.6" height="2" fill="#5A3A10"/>
    <path d="M 0,2 C -3,4 -3,7 0,9 C 3,7 3,4 0,2 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="5.5" rx="1.5" ry="2.2" fill="#FFE9A8"/>
  </g>
  <g transform="translate(100, 9)">
    <circle cx="0" cy="4" r="13" fill="url(#g3)"/>
    <rect x="-0.8" y="0" width="1.6" height="2" fill="#5A3A10"/>
    <path d="M 0,2 C -3,4 -3,7 0,9 C 3,7 3,4 0,2 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="5.5" rx="1.5" ry="2.2" fill="#FFE9A8"/>
  </g>
</svg>
`)}`;

// Bulb groups 1, 2, 3 on Mobile (swag width 84, bulbs at x=14, 28, 42, 56, 70)
const BULBS_G1_MOBILE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="84" height="34" viewBox="0 0 84 34" fill="none">
  <defs>
    <radialGradient id="mg1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF9A3C" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#FF8A00" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#FF7A00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g transform="translate(14, 7)">
    <circle cx="0" cy="3" r="10" fill="url(#mg1)"/>
    <rect x="-0.6" y="0" width="1.2" height="1.5" fill="#5A3A10"/>
    <path d="M 0,1.5 C -2.2,3 -2.2,5.5 0,7 C 2.2,5.5 2.2,3 0,1.5 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="4.2" rx="1.1" ry="1.6" fill="#FFE9A8"/>
  </g>
</svg>
`)}`;

const BULBS_G2_MOBILE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="84" height="34" viewBox="0 0 84 34" fill="none">
  <defs>
    <radialGradient id="mg2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF9A3C" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#FF8A00" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#FF7A00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g transform="translate(28, 11.5)">
    <circle cx="0" cy="3" r="10" fill="url(#mg2)"/>
    <rect x="-0.6" y="0" width="1.2" height="1.5" fill="#5A3A10"/>
    <path d="M 0,1.5 C -2.2,3 -2.2,5.5 0,7 C 2.2,5.5 2.2,3 0,1.5 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="4.2" rx="1.1" ry="1.6" fill="#FFE9A8"/>
  </g>
  <g transform="translate(56, 11.5)">
    <circle cx="0" cy="3" r="10" fill="url(#mg2)"/>
    <rect x="-0.6" y="0" width="1.2" height="1.5" fill="#5A3A10"/>
    <path d="M 0,1.5 C -2.2,3 -2.2,5.5 0,7 C 2.2,5.5 2.2,3 0,1.5 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="4.2" rx="1.1" ry="1.6" fill="#FFE9A8"/>
  </g>
</svg>
`)}`;

const BULBS_G3_MOBILE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="84" height="34" viewBox="0 0 84 34" fill="none">
  <defs>
    <radialGradient id="mg3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF9A3C" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#FF8A00" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#FF7A00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g transform="translate(42, 13)">
    <circle cx="0" cy="3" r="10" fill="url(#mg3)"/>
    <rect x="-0.6" y="0" width="1.2" height="1.5" fill="#5A3A10"/>
    <path d="M 0,1.5 C -2.2,3 -2.2,5.5 0,7 C 2.2,5.5 2.2,3 0,1.5 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="4.2" rx="1.1" ry="1.6" fill="#FFE9A8"/>
  </g>
  <g transform="translate(70, 7)">
    <circle cx="0" cy="3" r="10" fill="url(#mg3)"/>
    <rect x="-0.6" y="0" width="1.2" height="1.5" fill="#5A3A10"/>
    <path d="M 0,1.5 C -2.2,3 -2.2,5.5 0,7 C 2.2,5.5 2.2,3 0,1.5 Z" fill="#FFB23E"/>
    <ellipse cx="0" cy="4.2" rx="1.1" ry="1.6" fill="#FFE9A8"/>
  </g>
</svg>
`)}`;

/**
 * FIXED PRESET DATA FOR FIREFLY SPARKS (ADDITION 2)
 * 12 sparks per diya on desktop, first 6 on mobile.
 */
interface SparkPreset {
  id: number;
  size: number;
  sx: number;
  rise: number;
  dur: number;
  delay: number;
  isMobile: boolean;
}

const SPARKS_LEFT: SparkPreset[] = [
  { id: 1,  size: 3.2, sx: -14, rise: 175, dur: 4.2, delay: 0.2, isMobile: true },
  { id: 2,  size: 2.4, sx:  18, rise: 140, dur: 3.8, delay: 0.9, isMobile: true },
  { id: 3,  size: 3.8, sx: -22, rise: 215, dur: 5.4, delay: 1.7, isMobile: true },
  { id: 4,  size: 2.0, sx:   8, rise: 125, dur: 3.6, delay: 2.5, isMobile: true },
  { id: 5,  size: 3.0, sx: -10, rise: 190, dur: 4.8, delay: 3.2, isMobile: true },
  { id: 6,  size: 2.6, sx:  24, rise: 160, dur: 4.1, delay: 4.1, isMobile: true },
  { id: 7,  size: 3.5, sx: -26, rise: 228, dur: 5.7, delay: 0.6, isMobile: false },
  { id: 8,  size: 2.2, sx:  12, rise: 135, dur: 3.9, delay: 1.4, isMobile: false },
  { id: 9,  size: 4.0, sx: -18, rise: 205, dur: 5.1, delay: 2.1, isMobile: false },
  { id: 10, size: 2.5, sx:  20, rise: 150, dur: 4.4, delay: 3.6, isMobile: false },
  { id: 11, size: 3.1, sx:  -6, rise: 180, dur: 4.6, delay: 4.5, isMobile: false },
  { id: 12, size: 2.8, sx:  15, rise: 220, dur: 5.2, delay: 4.9, isMobile: false },
];

const SPARKS_RIGHT: SparkPreset[] = [
  { id: 1,  size: 2.8, sx:  16, rise: 165, dur: 4.0, delay: 1.1, isMobile: true },
  { id: 2,  size: 3.5, sx: -20, rise: 210, dur: 5.3, delay: 1.8, isMobile: true },
  { id: 3,  size: 2.2, sx:  10, rise: 130, dur: 3.7, delay: 2.6, isMobile: true },
  { id: 4,  size: 3.6, sx: -12, rise: 185, dur: 4.7, delay: 3.4, isMobile: true },
  { id: 5,  size: 2.5, sx:  22, rise: 155, dur: 4.3, delay: 4.3, isMobile: true },
  { id: 6,  size: 3.0, sx:  -8, rise: 195, dur: 4.9, delay: 0.4, isMobile: true },
  { id: 7,  size: 4.0, sx:  25, rise: 225, dur: 5.6, delay: 1.5, isMobile: false },
  { id: 8,  size: 2.1, sx: -16, rise: 145, dur: 3.9, delay: 2.3, isMobile: false },
  { id: 9,  size: 3.2, sx:  14, rise: 170, dur: 4.5, delay: 3.0, isMobile: false },
  { id: 10, size: 2.7, sx: -24, rise: 218, dur: 5.5, delay: 3.8, isMobile: false },
  { id: 11, size: 3.4, sx:   9, rise: 138, dur: 4.2, delay: 4.7, isMobile: false },
  { id: 12, size: 2.3, sx: -19, rise: 180, dur: 4.8, delay: 0.8, isMobile: false },
];

/**
 * FIXED PRESET DATA FOR SOFT BOKEH LIGHT SPOTS (ADDITION 3)
 * 7 spots per diya on desktop, first 4 on mobile.
 */
interface BokehPreset {
  id: number;
  size: number;
  x: number;
  y: number;
  fall: number;
  sway: number;
  dur: number;
  delay: number;
  peakOp: number;
  isMobile: boolean;
}

const BOKEH_LEFT: BokehPreset[] = [
  { id: 1, size: 22, x: 25,  y: 185, fall: 65, sway:   8, dur:  8.5, delay: 0.5, peakOp: 0.55, isMobile: true },
  { id: 2, size: 16, x: 75,  y: 155, fall: 50, sway: -10, dur:  7.2, delay: 2.1, peakOp: 0.45, isMobile: true },
  { id: 3, size: 30, x: 110, y: 195, fall: 75, sway:  12, dur:  9.8, delay: 4.3, peakOp: 0.50, isMobile: true },
  { id: 4, size: 12, x: 45,  y: 135, fall: 45, sway:  -6, dur:  7.8, delay: 6.2, peakOp: 0.40, isMobile: true },
  { id: 5, size: 26, x: 135, y: 170, fall: 80, sway:  14, dur: 10.4, delay: 1.4, peakOp: 0.60, isMobile: false },
  { id: 6, size: 18, x: -5,  y: 150, fall: 55, sway:  -8, dur:  8.0, delay: 3.6, peakOp: 0.45, isMobile: false },
  { id: 7, size: 34, x: 90,  y: 210, fall: 85, sway: -12, dur: 10.8, delay: 5.7, peakOp: 0.52, isMobile: false },
];

const BOKEH_RIGHT: BokehPreset[] = [
  { id: 1, size: 24, x: -25,  y: 190, fall: 70, sway:  -9, dur:  9.0, delay: 1.2, peakOp: 0.55, isMobile: true },
  { id: 2, size: 14, x: -80,  y: 155, fall: 48, sway:  11, dur:  7.5, delay: 3.4, peakOp: 0.45, isMobile: true },
  { id: 3, size: 28, x: -115, y: 200, fall: 78, sway: -14, dur: 10.2, delay: 5.1, peakOp: 0.50, isMobile: true },
  { id: 4, size: 11, x: -40,  y: 140, fall: 42, sway:   7, dur:  7.6, delay: 0.3, peakOp: 0.38, isMobile: true },
  { id: 5, size: 32, x: -140, y: 175, fall: 82, sway: -12, dur: 10.6, delay: 2.7, peakOp: 0.58, isMobile: false },
  { id: 6, size: 19, x:   8,  y: 160, fall: 58, sway:   9, dur:  8.4, delay: 4.8, peakOp: 0.42, isMobile: false },
  { id: 7, size: 20, x: -95,  y: 215, fall: 88, sway:  13, dur:  9.5, delay: 6.9, peakOp: 0.50, isMobile: false },
];

/**
 * Self-contained Diya Clay Lamp SVG Component
 */
function DiyaLamp({ isRight = false }: { isRight?: boolean }): React.JSX.Element {
  const delayClass = isRight ? 'diwali-flame-delay' : '';
  const glowDelayClass = isRight ? 'diwali-glow-delay' : '';

  return (
    <div
      className={`diwali-diya-unit relative pointer-events-none select-none ${isRight ? 'scale-x-[-1]' : ''}`}
      style={{ width: '100%', height: '100%', contain: 'layout paint' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 72 68"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`terracotta-${isRight ? 'r' : 'l'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B5541F" />
            <stop offset="60%" stopColor="#933D14" />
            <stop offset="100%" stopColor="#7A3410" />
          </linearGradient>

          <linearGradient id={`diya-lip-${isRight ? 'r' : 'l'}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9682C" />
            <stop offset="50%" stopColor="#E28B48" />
            <stop offset="100%" stopColor="#C9682C" />
          </linearGradient>

          <linearGradient id={`flame-grad-${isRight ? 'r' : 'l'}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#FF5100" />
            <stop offset="35%" stopColor="#FF8A00" />
            <stop offset="70%" stopColor="#FFC21A" />
            <stop offset="100%" stopColor="#FFF8D1" />
          </linearGradient>

          <radialGradient id={`flame-halo-${isRight ? 'r' : 'l'}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB347" stopOpacity="0.65" />
            <stop offset="45%" stopColor="#FF8811" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF7700" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          cx="36"
          cy="26"
          r="34"
          fill={`url(#flame-halo-${isRight ? 'r' : 'l'})`}
          className={`diwali-glow-anim ${glowDelayClass}`}
        />

        <g id="diya-bowl">
          <ellipse cx="36" cy="62" rx="26" ry="5" fill="#421606" opacity="0.6" />
          <path
            d="M 6,43 C 12,65 60,65 66,43 C 58,54 14,54 6,43 Z"
            fill={`url(#terracotta-${isRight ? 'r' : 'l'})`}
            stroke="#5E270C"
            strokeWidth="1.2"
          />
          <ellipse cx="36" cy="43" rx="30" ry="7.5" fill="#5E270C" />
          <ellipse cx="36" cy="42.5" rx="28.5" ry="6" fill="#7A3410" />
          <ellipse cx="36" cy="42.5" rx="22" ry="4" fill="#C57A18" opacity="0.75" />
          <path
            d="M 8,43 Q 36,49 64,43"
            stroke={`url(#diya-lip-${isRight ? 'r' : 'l'})`}
            strokeWidth="1"
            fill="none"
            opacity="0.85"
          />
        </g>

        <path
          d="M 35,42 Q 36,36 36.5,33"
          stroke="#3B1F0E"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <g
          className={`diwali-flame-anim ${delayClass}`}
          style={{ transformOrigin: '36px 36px' }}
        >
          <path
            d="M 36,12 C 43,22 43,33 36,36 C 29,33 29,22 36,12 Z"
            fill={`url(#flame-grad-${isRight ? 'r' : 'l'})`}
          />
          <path
            d="M 36,17 C 40,24 40,32 36,34 C 32,32 32,24 36,17 Z"
            fill="#FFFBE8"
            opacity="0.9"
          />
          <ellipse cx="36" cy="27" rx="1.8" ry="4" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Sparks Generator for a Diya (originating at the flame tip)
 */
function DiyaSparks({ presets }: { presets: SparkPreset[] }): React.JSX.Element {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: '50%',
        top: '18%',
        width: 0,
        height: 0,
        overflow: 'visible'
      }}
      aria-hidden="true"
    >
      {presets.map((sp) => (
        <span
          key={sp.id}
          className={`diwali-spark ${sp.isMobile ? 'block' : 'hidden md:block'}`}
          style={{
            ['--size' as any]: `${sp.size}px`,
            ['--sx' as any]: `${sp.sx}px`,
            ['--rise' as any]: `${sp.rise}px`,
            ['--dur' as any]: `${sp.dur}s`,
            ['--delay' as any]: `${sp.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Bokeh Generator for a Diya (warm yellow light spots)
 */
function DiyaBokeh({ presets }: { presets: BokehPreset[] }): React.JSX.Element {
  return (
    <div
      className="absolute pointer-events-none select-none inset-0 overflow-visible"
      aria-hidden="true"
    >
      {presets.map((bp) => (
        <span
          key={bp.id}
          className={`diwali-bokeh ${bp.isMobile ? 'block' : 'hidden md:block'}`}
          style={{
            ['--size' as any]: `${bp.size}px`,
            ['--x' as any]: `${bp.x}px`,
            ['--y' as any]: `${bp.y}px`,
            ['--fall' as any]: `${bp.fall}px`,
            ['--sway' as any]: `${bp.sway}px`,
            ['--dur' as any]: `${bp.dur}s`,
            ['--delay' as any]: `${bp.delay}s`,
            ['--peak-op' as any]: bp.peakOp,
          }}
        />
      ))}
    </div>
  );
}

/**
 * TOP HANGING GARLAND (TORAN) COMPONENT
 * Rendered inside the single sticky header wrapper as its last child:
 * position: absolute; top: 100%; left: 0; width: 100%; height: 44px (34px on mobile);
 * Because it is a direct child of the sticky header wrapper, it automatically moves,
 * stays, and behaves as ONE single unit with the black ticker + red nav bar!
 */
export function DiwaliTopGarland(): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!SHOW_DIWALI_DECOR) return;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => setMounted(true), { timeout: 800 });
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => setMounted(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!SHOW_DIWALI_DECOR || location.pathname.startsWith('/admin') || !mounted) {
    return null;
  }

  return (
    <div
      className="absolute left-0 w-full h-[34px] md:h-[44px] pointer-events-none select-none overflow-hidden z-[1]"
      style={{
        top: '100%',
        contain: 'layout paint'
      }}
      aria-hidden="true"
      id="diwali-top-garland"
    >
      <style>{`
        /* Toran Bulb Shimmer Keyframes */
        @keyframes diwaliBulbShimmer {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }

        .diwali-bulb-layer-1 {
          animation: diwaliBulbShimmer 2.4s ease-in-out infinite 0s;
          will-change: opacity;
        }
        .diwali-bulb-layer-2 {
          animation: diwaliBulbShimmer 2.4s ease-in-out infinite 0.8s;
          will-change: opacity;
        }
        .diwali-bulb-layer-3 {
          animation: diwaliBulbShimmer 2.4s ease-in-out infinite 1.6s;
          will-change: opacity;
        }

        .diwali-toran-wire {
          background-image: url("${WIRE_TASSEL_SVG_DESKTOP}");
          background-repeat: repeat-x;
          background-position: top center;
          background-size: 120px 44px;
        }
        .diwali-toran-g1 {
          background-image: url("${BULBS_G1_DESKTOP}");
          background-repeat: repeat-x;
          background-position: top center;
          background-size: 120px 44px;
        }
        .diwali-toran-g2 {
          background-image: url("${BULBS_G2_DESKTOP}");
          background-repeat: repeat-x;
          background-position: top center;
          background-size: 120px 44px;
        }
        .diwali-toran-g3 {
          background-image: url("${BULBS_G3_DESKTOP}");
          background-repeat: repeat-x;
          background-position: top center;
          background-size: 120px 44px;
        }

        @media (max-width: 768px) {
          .diwali-toran-wire {
            background-image: url("${WIRE_TASSEL_SVG_MOBILE}");
            background-size: 84px 34px;
          }
          .diwali-toran-g1 {
            background-image: url("${BULBS_G1_MOBILE}");
            background-size: 84px 34px;
          }
          .diwali-toran-g2 {
            background-image: url("${BULBS_G2_MOBILE}");
            background-size: 84px 34px;
          }
          .diwali-toran-g3 {
            background-image: url("${BULBS_G3_MOBILE}");
            background-size: 84px 34px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .diwali-bulb-layer-1,
          .diwali-bulb-layer-2,
          .diwali-bulb-layer-3 {
            animation: none !important;
            opacity: 0.85 !important;
          }
        }
      `}</style>

      {/* Layer 1: Static Golden Wire + Marigold Tassels */}
      <div className="absolute inset-0 diwali-toran-wire" />

      {/* Layer 2: Bulb Group 1 (Twinkle phase 0s) */}
      <div className="absolute inset-0 diwali-toran-g1 diwali-bulb-layer-1" />

      {/* Layer 3: Bulb Group 2 (Twinkle phase 0.8s) */}
      <div className="absolute inset-0 diwali-toran-g2 diwali-bulb-layer-2" />

      {/* Layer 4: Bulb Group 3 (Twinkle phase 1.6s) */}
      <div className="absolute inset-0 diwali-toran-g3 diwali-bulb-layer-3" />
    </div>
  );
}

/**
 * MASTER DIWALI DECOR OVERLAY COMPONENT
 * Renders the 2 bottom corner Diyas (with firefly sparks & soft bokeh spots)
 * and ambient edge glows through a portal into document.body.
 */
export function DiwaliDecor(): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!SHOW_DIWALI_DECOR) return;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => {
        setMounted(true);
      }, { timeout: 800 });
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => {
        setMounted(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!SHOW_DIWALI_DECOR) return null;
  if (location.pathname.startsWith('/admin')) return null;
  if (!mounted || typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div
      id="diwali-decor-bottom-portal-root"
      className="pointer-events-none select-none"
      aria-hidden="true"
    >
      <style>{`
        /* Flame Flicker Keyframes */
        @keyframes diwaliFlameFlicker {
          0%, 100% {
            transform: scaleY(1) scaleX(1) rotate(0deg);
            opacity: 0.98;
          }
          18% {
            transform: scaleY(1.06) scaleX(0.96) rotate(1.5deg);
            opacity: 1;
          }
          36% {
            transform: scaleY(0.93) scaleX(1.04) rotate(-1.5deg);
            opacity: 0.92;
          }
          54% {
            transform: scaleY(1.08) scaleX(0.95) rotate(-0.5deg);
            opacity: 1;
          }
          72% {
            transform: scaleY(0.95) scaleX(1.03) rotate(2deg);
            opacity: 0.94;
          }
          88% {
            transform: scaleY(1.02) scaleX(0.98) rotate(-1deg);
            opacity: 0.97;
          }
        }

        .diwali-flame-anim {
          animation: diwaliFlameFlicker 1.6s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .diwali-flame-delay {
          animation-delay: 0.6s !important;
        }

        /* Flame Halo Glow Keyframes */
        @keyframes diwaliGlowPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.9; }
        }

        .diwali-glow-anim {
          animation: diwaliGlowPulse 2.2s ease-in-out infinite;
          will-change: opacity;
        }
        .diwali-glow-delay {
          animation-delay: 0.6s !important;
        }

        /* Firefly Sparks Keyframes */
        @keyframes diwaliSparkFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(0.6);
            opacity: 0;
          }
          10% {
            transform: translate3d(calc(var(--sx) * 0.15), calc(var(--rise) * -0.1), 0) scale(1);
            opacity: 1;
          }
          28% {
            transform: translate3d(calc(var(--sx) * -0.4), calc(var(--rise) * -0.28), 0) scale(0.95);
            opacity: 0.95;
          }
          48% {
            transform: translate3d(calc(var(--sx) * 0.6), calc(var(--rise) * -0.5), 0) scale(0.85);
            opacity: 0.85;
          }
          68% {
            transform: translate3d(calc(var(--sx) * -0.25), calc(var(--rise) * -0.72), 0) scale(0.7);
            opacity: 0.7;
          }
          86% {
            transform: translate3d(calc(var(--sx) * 0.85), calc(var(--rise) * -0.88), 0) scale(0.5);
            opacity: 0.45;
          }
          100% {
            transform: translate3d(var(--sx), calc(var(--rise) * -1), 0) scale(0.3);
            opacity: 0;
          }
        }

        .diwali-spark {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, #FFF3B0 0%, #FFC21A 45%, #FF7A00 80%, rgba(255, 122, 0, 0) 100%);
          animation: diwaliSparkFloat var(--dur) ease-in-out infinite var(--delay);
          will-change: transform, opacity;
          width: var(--size);
          height: var(--size);
          margin-left: calc(var(--size) * -0.5);
          margin-top: calc(var(--size) * -0.5);
        }

        /* Soft Bokeh Light Spots Keyframes */
        @keyframes diwaliBokehDrift {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
          20% {
            transform: translate3d(calc(var(--sway) * 0.4), calc(var(--fall) * 0.2), 0);
            opacity: var(--peak-op, 0.5);
          }
          50% {
            transform: translate3d(calc(var(--sway) * -0.5), calc(var(--fall) * 0.5), 0);
            opacity: var(--peak-op, 0.55);
          }
          75% {
            transform: translate3d(calc(var(--sway) * 0.7), calc(var(--fall) * 0.75), 0);
            opacity: calc(var(--peak-op, 0.5) * 0.6);
          }
          100% {
            transform: translate3d(var(--sway), var(--fall), 0);
            opacity: 0;
          }
        }

        .diwali-bokeh {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, rgba(255, 215, 106, 0.55) 0%, rgba(255, 215, 106, 0.22) 50%, rgba(255, 215, 106, 0) 72%);
          animation: diwaliBokehDrift var(--dur) ease-in-out infinite var(--delay);
          will-change: transform, opacity;
          width: var(--size);
          height: var(--size);
          left: var(--x);
          bottom: var(--y);
        }

        @media (prefers-reduced-motion: reduce) {
          .diwali-spark,
          .diwali-bokeh {
            display: none !important;
          }
          .diwali-flame-anim,
          .diwali-glow-anim {
            animation: none !important;
            opacity: 0.85 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Soft Ambient Warm Peach Edge Glow */}
      <div
        className="fixed inset-y-0 left-0 w-16 md:w-36 pointer-events-none select-none z-[1]"
        style={{
          background: 'linear-gradient(to right, rgba(255, 217, 176, 0.28) 0%, rgba(255, 217, 176, 0.08) 50%, transparent 100%)',
          contain: 'strict'
        }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-y-0 right-0 w-16 md:w-36 pointer-events-none select-none z-[1]"
        style={{
          background: 'linear-gradient(to left, rgba(255, 217, 176, 0.28) 0%, rgba(255, 217, 176, 0.08) 50%, transparent 100%)',
          contain: 'strict'
        }}
        aria-hidden="true"
      />

      {/* Left Diya Group with Firefly Sparks & Soft Bokeh */}
      <div
        className="fixed left-3 z-[45] pointer-events-none select-none w-12 h-11 md:w-[72px] md:h-[68px] bottom-18 md:bottom-0"
        aria-hidden="true"
        id="diwali-diya-left-container"
      >
        <DiyaBokeh presets={BOKEH_LEFT} />
        <DiyaLamp isRight={false} />
        <DiyaSparks presets={SPARKS_LEFT} />
      </div>

      {/* Right Diya Group with Firefly Sparks & Soft Bokeh */}
      <div
        className="fixed right-3 z-[45] pointer-events-none select-none w-12 h-11 md:w-[72px] md:h-[68px] bottom-18 md:bottom-0"
        aria-hidden="true"
        id="diwali-diya-right-container"
      >
        <DiyaBokeh presets={BOKEH_RIGHT} />
        <DiyaLamp isRight={true} />
        <DiyaSparks presets={SPARKS_RIGHT} />
      </div>
    </div>,
    document.body
  );
}
