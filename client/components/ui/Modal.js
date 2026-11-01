'use client';

import { useEffect, useRef } from 'react';
import Icon from './Icon';

/**
 * Accessible Modal dialog for Looply (Dark Neon Theme)
 * Supports keyboard escape closing, focus trapping, screen-reader attributes,
 * and responsive sizing across all mobile and desktop viewports.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = ''
}) {
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  // Keyboard navigation & Escape key handling (WCAG 2.2 AA)
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Focus trap within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (previouslyFocusedElement.current?.focus) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  }[size] || 'max-w-md';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Dark semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-[#080D12]/80 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses} bg-[#151F29] rounded-2xl border border-[#263640] shadow-2xl shadow-black/60 overflow-hidden z-10 transition-transform animate-fade-in my-8 ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#263640]">
          <div>
            {title && (
              <h3 id="modal-title" className="text-base font-bold text-[#F4F8FA] tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p id="modal-description" className="text-xs text-[#9BAAB4] mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9BAAB4] hover:text-[#F4F8FA] rounded-lg hover:bg-[#1D2A35] transition-colors focus:outline-none focus:ring-2 focus:ring-[#19D3E3]"
            aria-label="Close dialog"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto text-[#F4F8FA]">
          {children}
        </div>
      </div>
    </div>
  );
}
