import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function inlineBuiltCss(): Plugin {
  return {
    name: 'inline-built-css',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      const bundle = ctx.bundle;
      if (!bundle) return html;
      return html.replace(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g, (match, href: string) => {
        const cleanHref = href.replace(/^\//, '');
        const asset = bundle[cleanHref];
        if (asset && asset.type === 'asset') return '<style>' + String(asset.source) + '</style>';
        return match;
      });
    },
  };
}

function verifyImageUrlsPlugin(): Plugin {
  return {
    name: 'verify-image-urls',
    enforce: 'post',
    transformIndexHtml(html) {
      if (html.includes('images.unsplash.com') && html.includes(',f-auto')) {
        console.warn('[Vite Build Warning] Erroneous ,f-auto detected on Unsplash URL in HTML shell. Cleaning...');
        return html.replace(/(https:\/\/images\.unsplash\.com\/[^"'\s]+),f-auto/g, '$1');
      }
      return html;
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      inlineBuiltCss(),
      verifyImageUrlsPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Parasmoni Jewellers and Brothers',
          short_name: 'Parasmoni',
          description: 'Handcrafted gold, diamond, polki, and antique heritage jewellery masterpieces.',
          theme_color: '#E31C24',
          background_color: '#1c0507',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/branding/JEWLLERS___GRAND_BROTHERS__6__5ekGzNryJ.png?tr=w-192,q-75,f-auto',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/branding/JEWLLERS___GRAND_BROTHERS__6__5ekGzNryJ.png?tr=w-512,q-75,f-auto',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'https://ik.imagekit.io/ugm0ru2xm/parasmoni/branding/JEWLLERS___GRAND_BROTHERS__6__5ekGzNryJ.png?tr=w-512,q-75,f-auto',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,jpg,jpeg,webp}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/offline\.html$/],
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              // ImageKit media (product photos, banners, showroom assets)
              urlPattern: /^https:\/\/ik\.imagekit\.io\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'imagekit-media-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Unsplash images fallback
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'unsplash-media-cache',
                expiration: {
                  maxEntries: 150,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Google Fonts stylesheets
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Google Fonts webfont binaries
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
              return 'react-vendor';
            }
            if (id.includes('/node_modules/react-router/') || id.includes('/node_modules/react-router-dom/')) {
              return 'router-vendor';
            }
            if (id.includes('/node_modules/firebase/')) {
              return 'firebase-vendor';
            }
          }
        }
      }
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
