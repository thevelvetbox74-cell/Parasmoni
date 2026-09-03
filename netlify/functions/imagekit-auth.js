import crypto from 'crypto';

export const handler = async (event, context) => {
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
    let privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[IMAGEKIT SECURITY ERROR] IMAGEKIT_PRIVATE_KEY is missing in Netlify environment variables.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'IMAGEKIT_PRIVATE_KEY is missing in Netlify variables.' })
      };
    }

    // Sanitize key by trimming whitespace and removing surrounding double/single quotes
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');

    const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes expiry

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
  } catch (error) {
    console.error('[IMAGEKIT AUTH ERROR] Failed to generate signature:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate secure upload parameters.' })
    };
  }
};
