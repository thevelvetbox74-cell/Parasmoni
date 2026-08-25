/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

/**
 * ImageKit Serverless Authentication Endpoint Handler
 * 
 * DESIGN PHILOSOPHY & SECURITY STANDARD:
 * -------------------------------------------------------------------------
 * This file is executed ONLY in a secure, server-side environment (such as
 * Netlify Functions, Cloudflare Workers, AWS Lambda, or a custom Express route).
 * 
 * It reads the environment variable process.env.IMAGEKIT_PRIVATE_KEY, which is
 * securely injected during deployment and hidden from public visitors.
 * 
 * Generating the cryptographic token:
 * 1. Generate a secure, randomized token (e.g., using UUID or randomBytes).
 * 2. Generate a future expiration timestamp (typically 30-45 minutes in the future).
 * 3. Generate an HMAC-SHA1 signature of the concatenation of (token + expire) 
 *    using the server-side private key.
 * 4. Respond with JSON containing: { token, expire, signature }
 * 
 * The client uses these parameters to upload directly from the browser to 
 * ImageKit, bypassing any binary routing through our server.
 * -------------------------------------------------------------------------
 */

export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
}

/**
 * Handler function mimicking a serverless context (Netlify / Node.js)
 */
export async function handleImageKitAuth(
  privateKey: string | undefined
): Promise<ImageKitAuthResponse> {
  const secretKey = privateKey || process.env.IMAGEKIT_PRIVATE_KEY;

  if (!secretKey) {
    throw new Error(
      'IMAGEKIT_PRIVATE_KEY is not defined. Secure upload authentication cannot be generated.'
    );
  }

  // Token: Unique random value representing this upload session
  const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

  // Expire: Expiration timestamp in seconds (typically current epoch + 30 mins)
  const expire = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes validity

  // Signature calculation: HMAC-SHA1 of (token + expire) using the Private Key
  const signature = crypto
    .createHmac('sha1', secretKey)
    .update(token + expire.toString())
    .digest('hex');

  return {
    token,
    expire,
    signature,
  };
}

/**
 * Example Netlify/AWS Lambda Serverless Handler Export
 */
export async function handler(event: any, context: any) {
  try {
    const authData = await handleImageKitAuth(undefined);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Adjust to match your app domain for strict CORS
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify(authData)
    };
  } catch (error: any) {
    console.error('Serverless Authentication Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Server Auth Generation Failed' })
    };
  }
}
