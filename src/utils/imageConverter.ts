/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Checks if a file is an SVG image.
 */
export function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

/**
 * Checks if a file is a valid image (excluding SVG for conversion choices if needed, but including it generally).
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Converts any raster image File object to WebP format client-side using Canvas API.
 * Preserves the file name but replaces the extension with .webp.
 */
export function convertToWebP(file: File, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    if (isSvgFile(file)) {
      // SVG shouldn't be converted as it is vector, resolve with original
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to create canvas 2D context for conversion.'));
            return;
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('WebP compression failed to generate a blob.'));
                return;
              }
              
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const webpFile = new File([blob], `${baseName}.webp`, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              
              resolve(webpFile);
            },
            'image/webp',
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image element for WebP conversion.'));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to load image file data URL.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };
    
    reader.readAsDataURL(file);
  });
}
