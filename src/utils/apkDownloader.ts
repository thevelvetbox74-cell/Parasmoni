/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Parasmoni Jewellers - Clean Android APK Downloader Utility
 */

/**
 * Triggers downloading an Android APK file cleanly
 * forcing the correct MIME type (application/vnd.android.package-archive)
 * and correct file extension (.apk) so Android phones do NOT save it as .zip
 */
export async function triggerApkDownload(
  apkUrl: string,
  targetFileName: string = 'Parasmoni_Jewellers.apk',
  onProgress?: (downloading: boolean, percent?: number) => void
): Promise<void> {
  if (onProgress) onProgress(true, 10);

  try {
    // 1. Fetch file as arrayBuffer/blob to enforce MIME type application/vnd.android.package-archive
    const response = await fetch(apkUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch APK file: ${response.statusText}`);
    }

    if (onProgress) onProgress(true, 60);

    const blob = await response.blob();

    // Re-create blob with explicit Android APK package MIME type
    const apkBlob = new Blob([blob], {
      type: 'application/vnd.android.package-archive'
    });

    // Create object URL
    const objectUrl = URL.createObjectURL(apkBlob);

    // Create download trigger link
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = targetFileName.endsWith('.apk') ? targetFileName : `${targetFileName}.apk`;
    link.setAttribute('type', 'application/vnd.android.package-archive');
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup object URL after delay
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(objectUrl);
      if (onProgress) onProgress(false, 100);
    }, 2000);

  } catch (err) {
    console.warn('Blob fetch failed, using fallback direct download:', err);
    
    // Fallback: If CORS or fetch fails, construct an anchor tag with explicit download attribute and ImageKit attachment flag
    const fallbackUrl = apkUrl.includes('?') 
      ? `${apkUrl}&ik-attachment=true` 
      : `${apkUrl}?ik-attachment=true`;

    const a = document.createElement('a');
    a.href = fallbackUrl;
    a.download = targetFileName.endsWith('.apk') ? targetFileName : `${targetFileName}.apk`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      if (onProgress) onProgress(false, 100);
    }, 1000);
  }
}
