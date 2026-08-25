/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Secure CMS & API Server
 */

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables from .env
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Route: ImageKit Secure Cryptographic Signature Generator
  app.get('/api/imagekit-auth', (req, res) => {
    try {
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
      
      if (!privateKey) {
        console.error('[IMAGEKIT SECURITY ERROR] IMAGEKIT_PRIVATE_KEY is missing in server environment variables.');
        return res.status(500).json({ 
          error: 'ImageKit private key configuration missing on the server.' 
        });
      }

      // 1. Generate unique token & expiration timestamp
      const token = crypto.randomUUID(); 
      const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes expiry

      // 2. Create cryptographic HMAC-SHA1 signature using ImageKit Private Key
      const signature = crypto
        .createHmac('sha1', privateKey)
        .update(token + expire)
        .digest('hex');

      // Return parameters to client
      return res.json({
        token,
        expire,
        signature
      });
    } catch (error: any) {
      console.error('[IMAGEKIT AUTH ERROR] Failed to generate secure signature:', error);
      return res.status(500).json({ error: 'Failed to generate secure upload parameters.' });
    }
  });

  // API Route: Delete from ImageKit securely using server private key
  app.delete('/api/imagekit-delete/:fileId', async (req, res) => {
    try {
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
      if (!privateKey) {
        console.error('[IMAGEKIT SECURITY ERROR] IMAGEKIT_PRIVATE_KEY is missing.');
        return res.status(500).json({ error: 'ImageKit private key configuration missing on server.' });
      }

      const { fileId } = req.params;
      if (!fileId) {
        return res.status(400).json({ error: 'File ID is required.' });
      }

      const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');
      
      const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader
        }
      });

      if (response.status === 204 || response.ok) {
        return res.json({ success: true });
      } else {
        const errMsg = await response.text();
        console.error('[IMAGEKIT DELETE API ERROR]', errMsg);
        return res.status(response.status).json({ error: errMsg || 'Failed to delete from ImageKit API.' });
      }
    } catch (error: any) {
      console.error('[IMAGEKIT DELETE SERVER ERROR] Failed to delete file:', error);
      return res.status(500).json({ error: error.message || 'Server error during deletion.' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Integrate Vite Dev Server Middleware or Serve Built Production Bundle
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[SYSTEM INFO] Vite development middleware loaded.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[SYSTEM INFO] Serving pre-compiled static files from /dist.');
  }

  // Bind to port 3000 and interface 0.0.0.0 as required by the environment
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER START] Parasmoni Jewellers core active at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[FATAL SERVER ERROR] Failed to start core server:', error);
  process.exit(1);
});
