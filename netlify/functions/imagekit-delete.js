export const handler = async (event, context) => {
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
    let privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[IMAGEKIT CONFIG ERROR] IMAGEKIT_PRIVATE_KEY is missing in Netlify environment variables.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'IMAGEKIT_PRIVATE_KEY is missing in Netlify variables.' })
      };
    }

    // Sanitize key by trimming whitespace and removing surrounding double/single quotes
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');

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
  } catch (error) {
    console.error('[IMAGEKIT DELETE ERROR]', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Server error during deletion.' })
    };
  }
};
