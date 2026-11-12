'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * SplitRealityViewer Component
 *
 * Looply signature dual-perspective media experience:
 * - Side A: ✨ The Final (Polished / Completed result)
 * - Side B: 👀 Behind the Reality (Raw / BTS / Making of)
 *
 * Supports fluid mouse and touch dragging with pointer capture, keyboard slider
 * controls, quick preset buttons, resilient fallback handling, and mobile-friendly touch targets.
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
    <div className={`relative group select-none space-y-2 ${className}`}>
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
        className={`relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[520px] overflow-hidden rounded-2xl border border-[#2D2938] bg-[#110F17] cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-[#FF6257] shadow-xl ${
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
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#17151D] text-center">
            <Icon name="image" className="w-8 h-8 text-[#FF6257]/60 mb-2" />
            <p className="text-xs font-semibold text-[#F6F2EA]">Reality Media Unavailable</p>
            <p className="text-[11px] text-[#777580] mt-1">Unable to load the second perspective.</p>
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
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#1E1B26] text-center"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
            }}
          >
            <Icon name="image" className="w-8 h-8 text-[#D5F36A]/60 mb-2" />
            <p className="text-xs font-semibold text-[#F6F2EA]">Primary Media Unavailable</p>
            <p className="text-[11px] text-[#777580] mt-1">Unable to load the primary perspective.</p>
          </div>
        )}

        {/* Loading Shimmer Overlay */}
        {!isBothLoaded && !primaryError && !realityError && (
          <div className="absolute inset-0 bg-[#1E1B26] animate-pulse flex flex-col items-center justify-center gap-2 z-15">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF6257] border-t-transparent animate-spin" />
            <p className="text-xs font-medium text-[#777580]">Loading Split-Reality perspectives...</p>
          </div>
        )}

        {/* Layer 3: Vertical Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#F6F2EA] pointer-events-none z-20 shadow-[0_0_12px_rgba(255,98,87,0.7)]"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* Central Handle Button (>=44px touch target) */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#17151D] border-2 border-[#FF6257] text-[#F6F2EA] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.7),0_0_14px_rgba(255,98,87,0.5)] transition-transform ${
              isDragging ? 'scale-110 shadow-[0_0_20px_rgba(255,98,87,0.8)]' : 'group-hover:scale-105'
            }`}
          >
            {/* Split Arrows Indicator */}
            <div className="flex items-center gap-1 text-[#F6F2EA]">
              <span className="text-[10px] font-black">◀</span>
              <span className="text-[10px] font-black">▶</span>
            </div>
          </div>
        </div>

        {/* Perspective Label Badges */}
        {/* Left Side: The Final */}
        <div
          className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-[#17151D]/85 backdrop-blur-md border border-[#D5F36A]/40 text-[#D5F36A] text-[11px] font-bold flex items-center gap-1.5 shadow-md pointer-events-none transition-opacity duration-200 ${
            sliderPosition < 15 ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D5F36A] animate-pulse" />
          <span>✨ {primaryLabel}</span>
        </div>

        {/* Right Side: Behind the Reality */}
        <div
          className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-[#17151D]/85 backdrop-blur-md border border-[#FF6257]/40 text-[#FF6257] text-[11px] font-bold flex items-center gap-1.5 shadow-md pointer-events-none transition-opacity duration-200 ${
            sliderPosition > 85 ? 'opacity-30' : 'opacity-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6257] animate-pulse" />
          <span>👀 {realityLabel}</span>
        </div>

        {/* Interactive Reveal Guide / Position Pill (Bottom Center) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-[#17151D]/90 backdrop-blur-md border border-[#2D2938] text-[10px] font-semibold text-[#777580] flex items-center gap-2 pointer-events-none shadow-lg">
          <Icon name="split" className="w-3 h-3 text-[#FF6257]" />
          <span className="text-[#F6F2EA]">
            {sliderPosition === 100
              ? 'Showing Final'
              : sliderPosition === 0
              ? 'Showing Reality'
              : `${sliderPosition}% Final`}
          </span>
          <span className="text-[#777580] hidden sm:inline">• Slide to reveal</span>
        </div>
      </div>

      {/* Accessible Quick Perspective Switch Controls */}
      {interactive && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSliderPosition(100)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer min-h-[30px] ${
                sliderPosition === 100
                  ? 'bg-[#D5F36A] text-[#17151D]'
                  : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
              }`}
            >
              ✨ Full Final
            </button>
            <button
              type="button"
              onClick={() => setSliderPosition(50)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer min-h-[30px] ${
                sliderPosition === 50
                  ? 'bg-[#FF6257] text-[#17151D]'
                  : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
              }`}
            >
              50 / 50 Split
            </button>
            <button
              type="button"
              onClick={() => setSliderPosition(0)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer min-h-[30px] ${
                sliderPosition === 0
                  ? 'bg-[#FF6257] text-[#17151D]'
                  : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
              }`}
            >
              👀 Full Reality
            </button>
          </div>

          <span className="text-[10px] text-[#777580] hidden sm:inline">
            Drag divider or use ← → arrow keys
          </span>
        </div>
      )}
    </div>
  );
}
