'use client';

import { useState, useRef, useCallback } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * SplitRealityViewer Component (Warm Social Playground Theme)
 *
 * Looply signature dual-perspective media experience:
 * - Side A: ✨ The Final (Polished / Completed result)
 * - Side B: 👀 Behind the Reality (Raw / BTS / Making of)
 *
 * Supports fluid mouse and touch dragging with pointer capture, keyboard slider
 * controls, quick preset buttons, and mobile-friendly touch targets.
 */
export default function SplitRealityViewer({
  primaryMedia,
  realityMedia,
  primaryLabel = 'The Final',
  realityLabel = 'Behind the Reality',
  initialPosition = 50,
  className = '',
  interactive = true
}) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [primaryLoaded, setPrimaryLoaded] = useState(false);
  const [realityLoaded, setRealityLoaded] = useState(false);
  const [primaryError, setPrimaryError] = useState(false);
  const [realityError, setRealityError] = useState(false);
  const containerRef = useRef(null);

  // Compute position percentage from clientX
  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percentage = Math.round((offsetX / rect.width) * 100);
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e) => {
    if (!interactive) return;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Pointer capture fallback
    }
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !interactive) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Pointer capture fallback
    }
  };

  // Accessible keyboard navigation
  const handleKeyDown = (e) => {
    if (!interactive) return;
    let nextPos = sliderPosition;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      nextPos = Math.max(0, sliderPosition - 5);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      nextPos = Math.min(100, sliderPosition + 5);
      e.preventDefault();
    } else if (e.key === 'Home') {
      nextPos = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      nextPos = 100;
      e.preventDefault();
    }
    setSliderPosition(nextPos);
  };

  const isBothLoaded = primaryLoaded && realityLoaded;

  return (
    <div className={`relative group select-none space-y-2.5 ${className}`}>
      {/* Outer Media Frame */}
      <div
        ref={containerRef}
        role="slider"
        tabIndex={interactive ? 0 : -1}
        aria-label="Split-Reality perspective reveal slider"
        aria-valuenow={sliderPosition}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${sliderPosition}% Final revealed, ${100 - sliderPosition}% Reality revealed`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={`relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[520px] overflow-hidden rounded-2xl border border-[#E7E5E0] bg-[#F1F0EC] cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] shadow-xs ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Layer 1: Behind the Reality Media (Bottom Layer) */}
        {!realityError ? (
          <img
            src={realityMedia}
            alt={realityLabel}
            onLoad={() => setRealityLoaded(true)}
            onError={() => setRealityError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
              realityLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#F1F0EC] text-center">
            <Icon name="image" className="w-8 h-8 text-[#FF6B6B]/60 mb-2" />
            <p className="text-xs font-semibold text-[#1E1E24]">Reality Media Unavailable</p>
            <p className="text-[11px] text-[#6B6B73] mt-1">Unable to load the second perspective.</p>
          </div>
        )}

        {/* Layer 2: The Final Media (Top Clipped Layer) */}
        {!primaryError ? (
          <img
            src={primaryMedia}
            alt={primaryLabel}
            onLoad={() => setPrimaryLoaded(true)}
            onError={() => setPrimaryError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
              primaryLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
            }}
            draggable={false}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white text-center"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
            }}
          >
            <Icon name="image" className="w-8 h-8 text-[#6C63FF]/60 mb-2" />
            <p className="text-xs font-semibold text-[#1E1E24]">Primary Media Unavailable</p>
            <p className="text-[11px] text-[#6B6B73] mt-1">Unable to load the primary perspective.</p>
          </div>
        )}

        {/* Loading Shimmer Overlay */}
        {!isBothLoaded && !primaryError && !realityError && (
          <div className="absolute inset-0 bg-[#F1F0EC] animate-pulse flex flex-col items-center justify-center gap-2 z-15">
            <div className="w-8 h-8 rounded-full border-2 border-[#6C63FF] border-t-transparent animate-spin" />
            <p className="text-xs font-medium text-[#6B6B73]">Loading perspectives...</p>
          </div>
        )}

        {/* Layer 3: Vertical Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-20 shadow-[0_0_10px_rgba(108,99,255,0.6)]"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* Central Handle Button (>=44px touch target) */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-[#6C63FF] text-[#6C63FF] flex items-center justify-center shadow-lg transition-transform ${
              isDragging ? 'scale-110 shadow-xl' : 'group-hover:scale-105'
            }`}
          >
            {/* Split Arrows Indicator */}
            <div className="flex items-center gap-1 text-[#6C63FF]">
              <span className="text-[10px] font-black">◀</span>
              <span className="text-[10px] font-black">▶</span>
            </div>
          </div>
        </div>

        {/* Perspective Label Badges */}
        {/* Left Side: The Final */}
        <div
          className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#E7E5E0] text-[#6C63FF] text-[11px] font-bold flex items-center gap-1.5 shadow-sm pointer-events-none transition-opacity duration-200 ${
            sliderPosition < 15 ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-pulse" />
          <span>✨ {primaryLabel}</span>
        </div>

        {/* Right Side: Behind the Reality */}
        <div
          className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#E7E5E0] text-[#FF6B6B] text-[11px] font-bold flex items-center gap-1.5 shadow-sm pointer-events-none transition-opacity duration-200 ${
            sliderPosition > 85 ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
          <span>👀 {realityLabel}</span>
        </div>

        {/* Interactive Reveal Guide / Position Pill (Bottom Center) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#E7E5E0] text-[10px] font-semibold text-[#6B6B73] flex items-center gap-2 pointer-events-none shadow-sm">
          <Icon name="split" className="w-3 h-3 text-[#6C63FF]" />
          <span className="text-[#1E1E24]">
            {sliderPosition === 100
              ? 'Showing Final'
              : sliderPosition === 0
              ? 'Showing Reality'
              : `${sliderPosition}% Final`}
          </span>
          <span className="text-[#6B6B73] hidden sm:inline">• Slide to reveal</span>
        </div>
      </div>

      {/* Accessible Quick Perspective Switch Controls */}
      {interactive && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSliderPosition(100)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer min-h-[30px] ${
                sliderPosition === 100
                  ? 'bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/30'
                  : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
              }`}
            >
              ✨ Full Final
            </button>
            <button
              type="button"
              onClick={() => setSliderPosition(50)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer min-h-[30px] ${
                sliderPosition === 50
                  ? 'bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/30'
                  : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
              }`}
            >
              50 / 50 Split
            </button>
            <button
              type="button"
              onClick={() => setSliderPosition(0)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer min-h-[30px] ${
                sliderPosition === 0
                  ? 'bg-[#FFEAEA] text-[#FF6B6B] border border-[#FF6B6B]/30'
                  : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
              }`}
            >
              👀 Full Reality
            </button>
          </div>

          <span className="text-[10px] text-[#6B6B73] hidden sm:inline">
            Drag divider or use ← → keys
          </span>
        </div>
      )}
    </div>
  );
}
