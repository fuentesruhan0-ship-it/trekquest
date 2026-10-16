import React, { useState, useRef } from 'react';
import { X, Camera, Sparkles, Check, Trash2, MapPin, Smile } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { PRESET_AVATAR_EMOJIS, isImagePhoto, isEmojiAvatar, compressImageForStorage } from '@/lib/avatarHelper';

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  updateProfile,
}) {
  if (!isOpen) return null;

  const [name, setName] = useState(user?.full_name || 'Hiker');
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url || '');
  const [customEmojiInput, setCustomEmojiInput] = useState(
    isEmojiAvatar(user?.photo_url) ? user.photo_url : ''
  );
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setErrorMsg('');
    try {
      // Client-side offline compression to fit effortlessly in localStorage (< 25KB)
      const compressedDataUrl = await compressImageForStorage(file, 256, 256);
      setPhotoUrl(compressedDataUrl);
      setCustomEmojiInput('');
    } catch (err) {
      console.warn('Image processing error:', err);
      setErrorMsg('Failed to process image file. Please try another image.');
    } finally {
      setIsProcessingPhoto(false);
      // Reset input value so re-selecting same file triggers onChange
      if (e.target) e.target.value = '';
    }
  };

  const handleSelectEmoji = (emoji) => {
    setPhotoUrl(emoji);
    setCustomEmojiInput(emoji);
  };

  const handleCustomEmojiChange = (e) => {
    const val = e.target.value;
    setCustomEmojiInput(val);
    if (val.trim()) {
      setPhotoUrl(val.trim());
    } else {
      setPhotoUrl('');
    }
  };

  const handleClearAvatar = () => {
    setPhotoUrl('');
    setCustomEmojiInput('');
  };

  const handleSave = async () => {
    const trimmedName = name.trim() || 'Hiker';
    setIsSaving(true);
    setErrorMsg('');

    try {
      if (updateProfile) {
        await updateProfile({
          full_name: trimmedName,
          photo_url: photoUrl,
        });
      }

      // Also ensure offline custom profile is saved
      const existing = JSON.parse(localStorage.getItem('trekquest_custom_profile') || '{}');
      const updated = {
        ...existing,
        full_name: trimmedName,
        photo_url: photoUrl,
      };
      localStorage.setItem('trekquest_custom_profile', JSON.stringify(updated));

      // Dispatch global window event for instant map & UI reactivity
      window.dispatchEvent(
        new CustomEvent('trekquest_profile_updated', {
          detail: { full_name: trimmedName, photo_url: photoUrl },
        })
      );

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.warn('Failed to save profile:', err);
      setErrorMsg('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b1710] border border-emerald-500/30 text-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-black text-base tracking-wide text-white">Customize Profile</h2>
              <p className="text-[11px] text-emerald-400/90 font-medium">Map Pin Avatar & Display Name</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 active:scale-90 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Map Live Visibility Notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs shadow-inner">
            <MapPin size={16} className="text-emerald-400 shrink-0" />
            <p className="text-[11px] leading-tight">
              <strong>Live on Map:</strong> Your chosen photo or emoji will appear directly at your GPS pin location!
            </p>
          </div>

          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center py-2 gap-2">
            <div className="relative group">
              <UserAvatar
                photoUrl={photoUrl}
                name={name}
                size="xl"
                className="shadow-2xl ring-4 ring-emerald-500/40"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-[#0b1710] active:scale-90 transition cursor-pointer"
                title="Upload Photo"
              >
                <Camera size={14} />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-300">
              {isImagePhoto(photoUrl)
                ? 'Uploaded Photo Avatar'
                : isEmojiAvatar(photoUrl)
                ? `Emoji Avatar (${photoUrl})`
                : 'Default Letter Avatar'}
            </p>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
              Hiker Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Explorer"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition"
            />
          </div>

          {/* Photo Upload Section */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera size={14} className="text-emerald-400" />
                Upload Personal Photo
              </span>
              {photoUrl && (
                <button
                  type="button"
                  onClick={handleClearAvatar}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 size={11} />
                  Reset to Initial
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <Camera size={14} />
                <span>{isProcessingPhoto ? 'Compressing...' : 'Upload from Device'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              100% Offline: Image is compressed and saved safely on your device.
            </p>
          </div>

          {/* Emoji Avatar Selection */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smile size={14} className="text-amber-400" />
                Or Pick Any Emoji Avatar
              </span>
              <span className="text-[10px] text-slate-400">Click any emoji</span>
            </div>

            {/* Grid of Preset Emojis */}
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-1 bg-black/30 rounded-xl border border-white/5">
              {PRESET_AVATAR_EMOJIS.map((emoji) => {
                const isSelected = photoUrl === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectEmoji(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white scale-110 shadow-lg ring-2 ring-emerald-400'
                        : 'bg-white/5 hover:bg-white/15 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>

            {/* Custom Emoji Input Field */}
            <div>
              <label className="text-[10px] text-slate-300 font-medium block mb-1">
                Type or paste <strong>any</strong> emoji of your choice:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customEmojiInput}
                  onChange={handleCustomEmojiChange}
                  placeholder="e.g. 🦄, 🐼, 🧙‍♂️, 🏄, 🚀, 🌸"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  maxLength={10}
                />
                {customEmojiInput && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                    {customEmojiInput}
                  </span>
                )}
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-500/30">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-2.5 px-5 py-4 border-t border-white/[0.08] bg-[#09130d] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl bg-white/[0.08] border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/15 active:scale-95 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isProcessingPhoto}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-400 text-slate-950 font-black'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 disabled:opacity-50'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check size={14} />
                <span>Profile Saved!</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <span>Save & Update Map</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
