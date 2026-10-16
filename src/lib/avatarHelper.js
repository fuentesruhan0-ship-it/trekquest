/**
 * avatarHelper.js
 * TrekQuest Offline Avatar & Profile Helper
 * Supports offline uploaded photos (compressed base64 data URLs), custom emojis, preset emojis,
 * and Leaflet map icon rendering.
 */

export function isImagePhoto(val) {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim();
  return (
    s.startsWith('data:image/') ||
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('blob:') ||
    s.startsWith('/')
  );
}

export function isEmojiAvatar(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  // If it's not a URL/base64 image, it's considered an emoji or symbol
  return !isImagePhoto(trimmed);
}

// Curated selection of outdoor, hiking, wildlife, adventure, and friendly emojis
export const PRESET_AVATAR_EMOJIS = [
  // Hikers & Sports
  '🧗', '🥾', '🏔️', '🌲', '⛺', '🦊',
  '🦅', '🐺', '🎒', '🧭', '🔥', '🦁',
  '🌿', '🏃', '🚴', '🌺', '☀️', '⭐',
  '🏕️', '🌋', '🌴', '🐾', '🦋', '🍄',
  '🦌', '🦉', '🐻', '🐒', '⚡', '🌈',
  '😎', '🤠', '🧗‍♀️', '🧗‍♂️', '🗺️', '📸'
];

/**
 * Compresses an uploaded image file client-side to a max dimension of 256x256,
 * returning a lightweight Base64 data URL (< 25KB) that easily fits into localStorage offline.
 */
export function compressImageForStorage(file, maxWidth = 256, maxHeight = 256) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target.result);
        }

        // Draw image on canvas and export as JPEG
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Returns inner HTML for Leaflet DivIcon avatar marker
 */
export function renderAvatarMarkerInnerHtml(photoUrl, initial, innerSize) {
  const isImg = isImagePhoto(photoUrl);
  const isEmoji = isEmojiAvatar(photoUrl);
  const safeInitial = initial ? String(initial).charAt(0).toUpperCase() : 'H';

  if (isImg) {
    return `
      <img 
        src="${photoUrl}" 
        alt="${safeInitial}" 
        style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" 
        onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';" 
      />
      <span style="display:none;width:100%;height:100%;border-radius:50%;background:#059669;color:white;font-weight:900;font-size:${Math.round(innerSize * 0.44)}px;align-items:center;justify-content:center;">
        ${safeInitial}
      </span>
    `.trim();
  }

  if (isEmoji) {
    return `
      <span style="display:flex;width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#064e3b,#059669);color:white;align-items:center;justify-content:center;font-size:${Math.round(innerSize * 0.58)}px;line-height:1;user-select:none;transform:translateY(-0.5px);">
        ${photoUrl.trim()}
      </span>
    `.trim();
  }

  return `
    <span style="display:flex;width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);color:white;font-weight:900;font-size:${Math.round(innerSize * 0.44)}px;align-items:center;justify-content:center;">
      ${safeInitial}
    </span>
  `.trim();
}
