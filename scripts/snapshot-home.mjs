/**
 * Build-time Home Snapshot Generator
 * Reads public Firestore collections via REST API and writes src/data/homeSnapshot.json
 * NEVER throws or fails the build (always exits with code 0).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ikUrl } from '../src/utils/imagekit.shared.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const snapshotPath = path.resolve(__dirname, '../src/data/homeSnapshot.json');

async function generateSnapshot() {
  try {
    const firebaseConfigPath = path.resolve(__dirname, '../firebase-applet-config.json');
    if (!fs.existsSync(firebaseConfigPath)) {
      console.log('snapshot-home.mjs: No firebase-applet-config.json found, keeping existing snapshot.');
      return;
    }

    const configRaw = fs.readFileSync(firebaseConfigPath, 'utf-8');
    const config = JSON.parse(configRaw);
    const projectId = config.projectId || process.env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = config.apiKey || process.env.VITE_FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
      console.log('snapshot-home.mjs: Missing projectId or apiKey, keeping existing snapshot.');
      return;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/categories?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`snapshot-home.mjs: Firestore REST API returned ${res.status}, keeping existing snapshot.`);
      return;
    }

    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents) || data.documents.length === 0) {
      console.log('snapshot-home.mjs: No documents in categories, keeping existing snapshot.');
      return;
    }

    const fetchedCategories = data.documents.map((doc, idx) => {
      const fields = doc.fields || {};
      const name = fields.name?.stringValue || fields.title?.stringValue || `Category ${idx + 1}`;
      const slug = fields.slug?.stringValue || name.toLowerCase().replace(/\s+/g, '-');
      const rawImageUrl = fields.imageUrl?.stringValue || fields.image?.stringValue || '';
      const transformedUrl = ikUrl(rawImageUrl, 240, 55);
      return {
        id: doc.name.split('/').pop(),
        name,
        slug,
        imageUrl: transformedUrl,
        link: `/jewellery?category=${encodeURIComponent(slug)}`
      };
    }).filter(c => c.imageUrl);

    if (fetchedCategories.length >= 4) {
      let existingSnapshot = {};
      try {
        existingSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
      } catch (e) {}

      existingSnapshot.categories = fetchedCategories;
      fs.writeFileSync(snapshotPath, JSON.stringify(existingSnapshot, null, 2), 'utf-8');
      console.log(`snapshot-home.mjs: Successfully updated snapshot with ${fetchedCategories.length} categories.`);
    }
  } catch (err) {
    console.log('snapshot-home.mjs: Error during snapshot generation (safe fallback used):', err.message);
  }
}

generateSnapshot().then(() => process.exit(0)).catch(() => process.exit(0));
