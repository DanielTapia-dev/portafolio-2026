'use client';

import {useEffect, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';

type ImageGalleryModalProps = {
  isOpen: boolean;
  title: string;
  images: string[];
  onClose: () => void;
};

export default function ImageGalleryModal({
  isOpen,
  title,
  images,
  onClose
}: ImageGalleryModalProps) {
  const FADE_DURATION_MS = 180;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveImageIndex(0);
      setIsFading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeImageIndex > images.length - 1) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, images.length]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen || images.length === 0) return null;

  const changeImage = (nextIndex: number) => {
    if (nextIndex === activeImageIndex || isFading) return;

    setIsFading(true);
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    fadeTimeoutRef.current = setTimeout(() => {
      setActiveImageIndex(nextIndex);
      setIsFading(false);
    }, FADE_DURATION_MS);
  };

  const showPrevImage = () => {
    const nextIndex = activeImageIndex === 0 ? images.length - 1 : activeImageIndex - 1;
    changeImage(nextIndex);
  };

  const showNextImage = () => {
    const nextIndex = activeImageIndex === images.length - 1 ? 0 : activeImageIndex + 1;
    changeImage(nextIndex);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/90 p-4 md:p-6 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.75)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Gallery for ${title}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.24),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_40%)]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/20 p-2 text-slate-200 hover:bg-black/35 hover:text-white transition-colors"
          aria-label="Close gallery"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 mb-5 pr-12">
          <p className="mb-2 inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs font-medium tracking-wide text-sky-100">
            Project Gallery
          </p>
          <h3 className="text-lg md:text-2xl font-semibold text-white">{title}</h3>
        </div>

        <div className="relative z-10">
          <div className="pointer-events-none absolute inset-0 rounded-xl border border-white/10" />
          <img
            src={images[activeImageIndex]}
            alt={`${title} - image ${activeImageIndex + 1}`}
            className={`w-full max-h-[68vh] object-contain rounded-xl bg-slate-950/40 transition-opacity duration-200 ${
              isFading ? 'opacity-0' : 'opacity-100'
            }`}
          />

          <div className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur">
            {activeImageIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2 text-slate-100 backdrop-blur hover:bg-black/50"
                aria-label="Previous image"
                disabled={isFading}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2 text-slate-100 backdrop-blur hover:bg-black/50"
                aria-label="Next image"
                disabled={isFading}
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="relative z-10 mt-4 rounded-xl border border-white/10 bg-black/20 p-2">
            <div className="flex items-center justify-center gap-2">
            {images.map((thumb, index) => (
              <button
                key={`${thumb}-${index}`}
                type="button"
                onClick={() => changeImage(index)}
                className={`h-14 w-20 overflow-hidden rounded-lg border transition-all ${
                  activeImageIndex === index
                    ? 'border-sky-300 shadow-[0_0_0_1px_rgba(125,211,252,0.45)]'
                    : 'border-white/15 opacity-70 hover:opacity-100 hover:border-white/40'
                }`}
                aria-label={`Select image ${index + 1}`}
                disabled={isFading}
              >
                <img
                  src={thumb}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
