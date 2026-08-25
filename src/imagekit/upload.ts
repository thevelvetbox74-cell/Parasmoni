/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { imageKitClientConfig, isImageKitConfigured, IMAGEKIT_FOLDERS } from './client';

export interface ImageKitUploadResult {
  fileId: string;
  name: string;
  url: string;
  filePath: string;
}

/**
 * Uploads a file directly to ImageKit from the browser.
 * 
 * Flow:
 * 1. Request cryptographic upload signature from our secure serverless endpoint.
 * 2. Send the binary file + signature + token directly to ImageKit.
 * 3. Return fileId, url, and path to save as light metadata in Firestore.
 */
export async function uploadToImageKit(
  file: File,
  folderPath: typeof IMAGEKIT_FOLDERS[keyof typeof IMAGEKIT_FOLDERS]
): Promise<ImageKitUploadResult> {
  if (!isImageKitConfigured) {
    throw new Error('ImageKit configuration is missing in client-side environment.');
  }

  // 1. Fetch authentication parameters from secure serverless function
  // In development/production, we look up our relative serverless API endpoint
  const authEndpoint = '/api/imagekit-auth';
  
  let authParams;
  try {
    const authResponse = await fetch(authEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication server returned status ${authResponse.status}`);
    }

    authParams = await authResponse.json();
  } catch (error) {
    console.error('Failed to obtain ImageKit signature from auth server:', error);
    throw new Error(
      'Image upload is disabled: Failed to retrieve secure upload signature from the server.'
    );
  }

  const { token, expire, signature } = authParams;

  if (!token || !expire || !signature) {
    throw new Error('Invalid signature payload received from authentication server.');
  }

  // 2. Build the multipart/form-data payload for ImageKit API
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name.replace(/\s+/g, '_')); // Replace spaces with underscores
  formData.append('publicKey', imageKitClientConfig.publicKey);
  formData.append('signature', signature);
  formData.append('token', token);
  formData.append('expire', expire.toString());
  formData.append('folder', folderPath);

  // 3. Post directly to the official ImageKit API endpoint
  const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';

  try {
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`ImageKit Upload API failed with status ${uploadResponse.status}: ${errorText}`);
    }

    const data = await uploadResponse.json();

    // 4. Return metadata structures (Safe and light for Firestore insertion)
    return {
      fileId: data.fileId,
      name: data.name,
      url: data.url,
      filePath: data.filePath,
    };
  } catch (error) {
    console.error('Failed uploading binary asset directly to ImageKit API:', error);
    throw error;
  }
}
