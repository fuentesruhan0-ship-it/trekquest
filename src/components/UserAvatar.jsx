import React, { useState } from 'react';
import { isImagePhoto, isEmojiAvatar } from '@/lib/avatarHelper';

/**
 * UserAvatar
 * Renders user avatar supporting uploaded photos (Base64/URL), emojis, or initial fallback.
 */
export default function UserAvatar({
  photoUrl = '',
  name = 'Hiker',
  size = 'md',
  className = '',
  border = true,
  onClick = undefined,
  title = '',
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || 'H').charAt(0).toUpperCase();

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
  };

  const emojiSizes = {
    xs: 'text-xs',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  const containerSizeClass = sizeClasses[size] || (typeof size === 'string' && size.includes('w-') ? size : 'w-10 h-10 text-sm');
  const emojiSizeClass = emojiSizes[size] || 'text-xl';

  const isImg = isImagePhoto(photoUrl) && !imgError;
  const isEmoji = isEmojiAvatar(photoUrl);

  return (
    <div
      onClick={onClick}
      title={title || name}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none ${
        border ? 'border-2 border-emerald-400/80 shadow-md' : ''
      } ${
        isEmoji
          ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white'
          : isImg
          ? 'bg-slate-900'
          : 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
      } ${containerSizeClass} ${className} ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition' : ''}`}
    >
      {isImg ? (
        <img
          src={photoUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : isEmoji ? (
        <span className={`leading-none flex items-center justify-center transform -translate-y-[0.5px] ${emojiSizeClass}`}>
          {photoUrl.trim()}
        </span>
      ) : (
        <span className="font-black text-white leading-none">
          {initial}
        </span>
      )}
    </div>
  );
}
