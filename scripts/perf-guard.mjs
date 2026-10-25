/**
 * Build Performance Guardrail & Audit Script
 * Runs post-build to verify zero regressions in bundle sizes, image URLs, or Firebase inclusion.
 * ALWAYS exits with code 0 (never fails deployment).
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const srcDir = path.resolve(rootDir, 'src');

console.log('PERF-GUARD: Starting build audit...');

function checkDist() {
  if (!fs.existsSync(distDir)) {
    console.log('PERF-GUARD: dist/ directory not found (skipping dist checks).');
    return;
  }

  const htmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8');

    // Check 1: Firebase referenced in dist/index.html
    if (html.includes('firebase') && html.includes('.js')) {
      console.warn('PERF-GUARD WARNING: Firebase bundle found referenced in dist/index.html');
    } else {
      console.log('PERF-GUARD SUCCESS: Firebase SDK is absent from initial dist/index.html');
    }

    // Check 2: Render-blocking stylesheet
    if (/<link rel="stylesheet"[^>]*href=/i.test(html)) {
      console.warn('PERF-GUARD WARNING: Render-blocking <link rel="stylesheet"> found in dist/index.html');
    } else {
      console.log('PERF-GUARD SUCCESS: App CSS is fully inlined in dist/index.html');
    }

    // Check 3: ImageKit without w-
    const rawIkMatches = html.match(/ik\.imagekit\.io\/[^"'\s]+/g) || [];
    const missingWidth = rawIkMatches.filter(url => !url.includes('w-') && !url.includes('w='));
    if (missingWidth.length > 0) {
      console.warn(`PERF-GUARD WARNING: Found ${missingWidth.length} ImageKit URLs without width in dist/index.html:`, missingWidth.slice(0, 3));
    } else {
      console.log('PERF-GUARD SUCCESS: All ImageKit URLs in dist/index.html specify explicit width parameters');
    }

    // Check 4: ,f-auto on non-ImageKit URLs
    const invalidFAuto = html.match(/https?:\/\/(?!ik\.imagekit\.io|imagekit\.io)[^"'\s]+,f-auto/g) || [];
    if (invalidFAuto.length > 0) {
      console.warn(`PERF-GUARD WARNING: Found invalid ,f-auto on non-ImageKit URLs:`, invalidFAuto);
    } else {
      console.log('PERF-GUARD SUCCESS: No erroneous ,f-auto found on non-ImageKit hosts');
    }

    // Check 5: Demo hosts in initial dist/index.html
    const demoHosts = html.match(/https:\/\/(images\.unsplash\.com|images\.pexels\.com|picsum\.photos)[^"'\s]+/g) || [];
    if (demoHosts.length > 0) {
      console.log(`PERF-GUARD NOTICE: Initial HTML shell includes ${demoHosts.length} remote fallback URLs (acceptable for static snapshot).`);
    }
  }

  // Check 6: JS File Gzip Sizes
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(assetsDir, file);
        const content = fs.readFileSync(filePath);
        const gzipped = zlib.gzipSync(content);
        const gzipKb = (gzipped.length / 1024).toFixed(1);

        if (file.startsWith('index-') && gzipped.length > 90 * 1024) {
          console.warn(`PERF-GUARD WARNING: Entry chunk ${file} is ${gzipKb} KB gzip (exceeds 90 KB budget).`);
        } else {
          console.log(`PERF-GUARD CHUNK: ${file} -> ${gzipKb} KB gzip`);
        }
      }
    });
  }
}

function scanSrc(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanSrc(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check raw <img outside Img.tsx and OptimizedImage.tsx
      if (!fullPath.includes('Img.tsx') && !fullPath.includes('OptimizedImage.tsx')) {
        const rawImgMatches = content.match(/<img\s+/g) || [];
        if (rawImgMatches.length > 0) {
          const relPath = path.relative(rootDir, fullPath);
          console.warn(`PERF-GUARD NOTICE: Found ${rawImgMatches.length} raw <img tag(s) in ${relPath}. Prefer <Img role="..." />.`);
        }
      }

      // Check direct firebase/ imports outside admin and firebase/ directory
      if (!fullPath.includes('/admin/') && !fullPath.includes('/firebase/') && !fullPath.includes('lazyFirebase.ts')) {
        if (/import\s+.*\s+from\s+['"]firebase\//.test(content)) {
          const relPath = path.relative(rootDir, fullPath);
          console.warn(`PERF-GUARD WARNING: Direct 'firebase/' import in public file ${relPath}. Use firestoreRest or lazy load.`);
        }
      }
    }
  });
}

try {
  checkDist();
  scanSrc(srcDir);
  console.log('PERF-GUARD: Audit complete.');
} catch (e) {
  console.warn('PERF-GUARD NOTICE: Audit encountered an error:', e.message);
}

process.exit(0);
