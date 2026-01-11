"use client";

import { SplitScreenContent } from "./SplitScreenContent";
import { useState, useEffect, useRef } from "react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'iframe' | 'pdf' | 'image' | 'text' | null;
  iframeUrl: string | null;
  originalUrl: string | null;
  readerUrl: string | null;
  textContent: string | null;
  textTitle: string | null;
  switchToReaderMode: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  contentType,
  iframeUrl,
  originalUrl,
  readerUrl,
  textContent,
  textTitle,
  switchToReaderMode,
}: MobileDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Lock body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250); // Match animation duration
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !drawerRef.current) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Only allow swiping right (positive diff)
    if (diff > 0) {
      drawerRef.current.style.transform = `translateX(${diff}px)`;
      drawerRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !drawerRef.current) return;

    const diff = currentX.current - startX.current;

    // Threshold: dismiss if swiped > 100px or > 30% of width
    const threshold = Math.max(100, window.innerWidth * 0.3);

    if (diff > threshold) {
      // Trigger close
      drawerRef.current.style.transition = '';
      handleClose();
    } else {
      // Snap back
      drawerRef.current.style.transform = 'translateX(0)';
      drawerRef.current.style.transition = '';
    }

    isDragging.current = false;
    startX.current = 0;
    currentX.current = 0;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 ${
          isClosing ? 'opacity-0' : 'animate-fade-in'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`fixed top-0 right-0 bottom-0 w-full z-50 bg-white ${
          isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Screen reader title */}
        <h2 id="drawer-title" className="sr-only">
          {contentType === 'text' ? textTitle : 'Split screen content'}
        </h2>

        {/* Live region for state changes */}
        <div role="status" aria-live="polite" className="sr-only">
          {isOpen ? 'Split screen drawer opened' : 'Split screen drawer closed'}
        </div>

        {/* Content */}
        <SplitScreenContent
          isMobile={true}
          contentType={contentType}
          iframeUrl={iframeUrl}
          originalUrl={originalUrl}
          readerUrl={readerUrl}
          textContent={textContent}
          textTitle={textTitle}
          onClose={handleClose}
          switchToReaderMode={switchToReaderMode}
        />
      </div>
    </>
  );
}
