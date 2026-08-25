import { Handler } from '@netlify/functions';
import crypto from 'crypto';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[IMAGEKIT CONFIG ERROR] IMAGEKIT_PRIVATE_KEY is not defined in Netlify variables.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'ImageKit private key configuration missing on the server.' })
      };
    }

    // 1. Generate unique UUID token and validity epoch seconds timestamp
    const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes expiry

    // 2. Cryptographically hash token and expiry using secure HMAC-SHA1
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire.toString())
      .digest('hex');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        expire,
        signature
      })
    };
  } catch (error: any) {
    console.error('[SERVERLESS AUTH EXCEPTION]', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate secure upload parameters.' })
    };
  }
};
