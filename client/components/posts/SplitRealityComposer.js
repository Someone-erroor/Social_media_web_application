'use client';

import { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import SplitRealityViewer from './SplitRealityViewer';
import { postService } from '@/services/postService';

// Curated high-fidelity Split-Reality demo presets for rapid testing and inspiration
const DEMO_PRESETS = [
  {
    id: 'design',
    name: '🎨 Product Design: Polished UI vs Raw Wireframe',
    final: 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=900&auto=format&fit=crop&q=80',
    reality: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&auto=format&fit=crop&q=80',
    caption: 'From napkin wireframes to pixel-perfect design system. The reality of crafting intuitive interfaces! 🔀'
  },
  {
    id: 'photo',
    name: '📷 Photography: Color Graded vs RAW Exposure',
    final: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80',
    reality: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&auto=format&fit=crop&q=80',
    caption: 'Sunrise over Yosemite. Swipe to see the unedited RAW capture straight from the camera sensor.'
  },
  {
    id: 'coding',
    name: '💻 Dev Environment: Production App vs Late Night Code',
    final: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80',
    reality: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&auto=format&fit=crop&q=80',
    caption: 'What the client sees on deployment day vs the 3:00 AM coffee-fueled terminal session.'
  }
];

export default function SplitRealityComposer({
  onPostCreated,
  onCancel,
  defaultCircleId = null,
  isUnverified = false
}) {
  const [primaryMedia, setPrimaryMedia] = useState('');
  const [realityMedia, setRealityMedia] = useState('');
  const [caption, setCaption] = useState('');
  const [activeStep, setActiveStep] = useState('final'); // 'final' | 'reality' | 'caption' | 'preview'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const primaryInputRef = useRef(null);
  const realityInputRef = useRef(null);

  // File to base64 Data URL converter
  const handleFileChange = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPEG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        if (target === 'primary') {
          setPrimaryMedia(result);
          setErrorMessage('');
        } else {
          setRealityMedia(result);
          setErrorMessage('');
        }
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset) => {
    setPrimaryMedia(preset.final);
    setRealityMedia(preset.reality);
    setCaption(preset.caption);
    setErrorMessage('');
    setActiveStep('preview');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (isUnverified) {
      setErrorMessage('Please verify your email address to publish posts.');
      return;
    }

    if (!primaryMedia.trim() || !realityMedia.trim()) {
      setErrorMessage('Both Primary (Final) and Reality (BTS) images are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await postService.createSplitRealityPost({
        content: caption.trim() || undefined,
        primaryMedia: primaryMedia.trim(),
        realityMedia: realityMedia.trim(),
        circle: defaultCircleId || undefined
      });

      if (res?.success && res.post) {
        onPostCreated?.(res.post);
      } else {
        throw new Error(res?.message || 'Failed to create Split-Reality post.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to publish post. Please check media inputs.');
    } finally {
      setLoading(false);
    }
  };

  const canPreview = Boolean(primaryMedia.trim() && realityMedia.trim());

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#6C63FF]/30 space-y-4 animate-fade-in shadow-sm">
      {/* Header and Step Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E7E5E0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#EEEAFE] border border-[#6C63FF]/30 flex items-center justify-center text-[#6C63FF]">
            <Icon name="split" className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E1E24] flex items-center gap-2 font-display">
              Create Split-Reality Post
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20">
                Signature Format
              </span>
            </h2>
            <p className="text-[11px] text-[#6B6B73]">
              Showcase two connected perspectives: What you see → What really happened behind it.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="text-xs font-semibold text-[#6B6B73] hover:text-[#1E1E24] self-end sm:self-auto px-2 py-1 rounded-lg hover:bg-[#F1F0EC] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center justify-between animate-fade-in">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-[#6B6B73] hover:text-[#1E1E24] ml-2 font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Preset Inspiration Strip */}
      <div className="p-3 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-2">
        <p className="text-[11px] font-bold text-[#1E1E24] flex items-center gap-1.5 font-display">
          <Icon name="sparkles" className="w-3.5 h-3.5 text-[#6C63FF]" />
          Instant Demo Presets
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-[#E7E5E0] hover:border-[#6C63FF]/50 text-[#1E1E24] hover:text-[#6C63FF] transition-all text-left shadow-2xs cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#E7E5E0] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveStep('final')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStep === 'final'
              ? 'bg-[#EEEAFE] text-[#6C63FF] shadow-2xs'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
          }`}
        >
          <span>✨ 1. The Final</span>
          {primaryMedia && <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('reality')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStep === 'reality'
              ? 'bg-[#FFEAEA] text-[#FF6B6B] shadow-2xs'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
          }`}
        >
          <span>👀 2. Behind the Reality</span>
          {realityMedia && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('caption')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStep === 'caption'
              ? 'bg-[#FFF7E0] text-[#B28200] shadow-2xs'
              : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
          }`}
        >
          <span>✍️ 3. Caption</span>
          {caption.trim() && <span className="w-1.5 h-1.5 rounded-full bg-[#B28200]" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('preview')}
          disabled={!canPreview}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeStep === 'preview'
              ? 'bg-[#1E1E24] text-white'
              : 'text-[#6B6B73] hover:text-[#1E1E24] disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <span>🔀 4. Live Preview</span>
        </button>
      </div>

      {/* Step 1: The Final Perspective */}
      {activeStep === 'final' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1E1E24] font-display">
              Side A — ✨ The Final (Polished Result)
            </label>
            <span className="text-[11px] text-[#6C63FF] font-semibold">Primary Perspective</span>
          </div>

          <p className="text-xs text-[#6B6B73]">
            The completed artwork, final photograph, polished UI, or finished product that viewers initially see.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={primaryMedia.startsWith('data:') ? '[Uploaded Local Image File]' : primaryMedia}
              onChange={(e) => setPrimaryMedia(e.target.value)}
              placeholder="Paste public image URL (https://...)..."
              disabled={loading}
              className="flex-1 rounded-xl border border-[#E7E5E0] bg-white px-3 py-2 text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-none focus:border-[#6C63FF]"
            />
            <input
              ref={primaryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'primary')}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => primaryInputRef.current?.click()}
              icon={<Icon name="image" className="w-4 h-4" />}
            >
              Choose File
            </Button>
          </div>

          {primaryMedia && (
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#E7E5E0] bg-[#F1F0EC]">
              <img
                src={primaryMedia}
                alt="Primary Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPrimaryMedia('')}
                className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/90 text-[#FF6B6B] hover:bg-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setActiveStep('reality')}
              disabled={!primaryMedia.trim()}
            >
              Next: Behind the Reality →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Behind the Reality */}
      {activeStep === 'reality' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1E1E24] font-display">
              Side B — 👀 Behind the Reality (The Making-Of / Raw)
            </label>
            <span className="text-[11px] text-[#FF6B6B] font-semibold">Revealed Perspective</span>
          </div>

          <p className="text-xs text-[#6B6B73]">
            The raw capture, wireframe, unedited photo, work-in-progress, or behind-the-scenes setup.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={realityMedia.startsWith('data:') ? '[Uploaded Local Image File]' : realityMedia}
              onChange={(e) => setRealityMedia(e.target.value)}
              placeholder="Paste public image URL (https://...)..."
              disabled={loading}
              className="flex-1 rounded-xl border border-[#E7E5E0] bg-white px-3 py-2 text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-none focus:border-[#FF6B6B]"
            />
            <input
              ref={realityInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'reality')}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => realityInputRef.current?.click()}
              icon={<Icon name="image" className="w-4 h-4" />}
            >
              Choose File
            </Button>
          </div>

          {realityMedia && (
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#E7E5E0] bg-[#F1F0EC]">
              <img
                src={realityMedia}
                alt="Reality Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setRealityMedia('')}
                className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/90 text-[#FF6B6B] hover:bg-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveStep('final')}
            >
              ← Back to Final
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setActiveStep('caption')}
              disabled={!realityMedia.trim()}
            >
              Next: Caption & Story →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Caption / Story */}
      {activeStep === 'caption' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1E1E24] font-display">
              Post Caption & Story
            </label>
            <span className="text-[11px] text-[#6B6B73]">Optional</span>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Share the story behind this split-reality moment..."
            className="w-full resize-none rounded-xl border border-[#E7E5E0] bg-white p-3 text-xs text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-none focus:border-[#6C63FF]"
          />

          <div className="flex items-center justify-between text-[11px] text-[#6B6B73]">
            <span>{caption.length} / 1000 characters</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep('reality')}
              >
                ← Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setActiveStep('preview')}
                disabled={!canPreview}
              >
                Test Interactive Slider →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Live Interactive Preview */}
      {activeStep === 'preview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#1E1E24] font-display">
                🔀 Interactive Split-Reality Preview
              </p>
              <p className="text-[11px] text-[#6B6B73]">
                Drag the slider below to test how your community will experience this post.
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#4CAF78] bg-[#E8F7EE] border border-[#4CAF78]/30 px-2 py-0.5 rounded-full">
              Live Preview
            </span>
          </div>

          <SplitRealityViewer
            primaryMedia={primaryMedia}
            realityMedia={realityMedia}
          />

          {caption.trim() && (
            <p className="text-xs text-[#1E1E24] p-3 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] whitespace-pre-wrap">
              {caption}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#E7E5E0]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveStep('caption')}
              disabled={loading}
            >
              ← Edit Details
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={loading || !canPreview}
              icon={<Icon name="split" className="w-4 h-4" />}
            >
              {loading ? 'Publishing...' : 'Publish Split-Reality Post'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
