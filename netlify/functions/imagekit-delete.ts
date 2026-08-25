import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[IMAGEKIT CONFIG ERROR] IMAGEKIT_PRIVATE_KEY is missing.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'ImageKit private key configuration missing on the server.' })
      };
    }

    // Since Netlify redirects from /api/imagekit-delete/* to /.netlify/functions/imagekit-delete,
    // the splat path is inside event.path. We parse the last segment as our target fileId.
    const pathParts = event.path.split('/');
    const fileId = pathParts[pathParts.length - 1];

    if (!fileId || fileId === 'imagekit-delete') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'File ID is required.' })
      };
    }

    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');
    
    const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader
      }
    });

    if (response.status === 204 || response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    } else {
      const errMsg = await response.text();
      console.error('[IMAGEKIT API ERROR LOG]', errMsg);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: errMsg || 'Failed to delete from ImageKit API.' })
      };
    }
  } catch (error: any) {
    console.error('[SERVERLESS DELETE EXCEPTION]', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Server error during deletion.' })
    };
  }
};
