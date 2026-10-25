'use client';

import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {ChevronLeft, ChevronRight, Images, Maximize2, X} from 'lucide-react';

const FADE_DURATION_MS = 180;

type ProjectGalleryProps = {
  images: string[];
  title: string;
};

export default function ProjectGallery({images, title}: ProjectGalleryProps) {
  const t = useTranslations('Gallery');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const hasMany = images.length > 1;

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  const open = () => {
    setActive(0);
    setIsFading(false);
    // Native modal dialog: focus trap, Esc to close and focus restore for free.
    dialogRef.current?.showModal();
  };

  const close = () => dialogRef.current?.close();

  const changeImage = (nextIndex: number) => {
    if (nextIndex === active || isFading) return;

    setIsFading(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

    fadeTimeoutRef.current = setTimeout(() => {
      setActive(nextIndex);
      setIsFading(false);
    }, FADE_DURATION_MS);
  };

  // Wraps around at both ends.
  const step = (delta: number) =>
    changeImage((active + delta + images.length) % images.length);

  const altFor = (index: number) =>
    t('screenshotAlt', {title, index: index + 1, total: images.length});

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={t('open', {title})}
        className="group block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border bg-card text-left shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_30px_80px_-30px_var(--primary)]"
      >
        {/* Browser chrome: frames screenshots of any shape consistently. */}
        <span className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          {hasMany && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Images size={13} />
              {t('photoCount', {count: images.length})}
            </span>
          )}
        </span>

        {/* Cover fills the frame from the top, like a page scrolled to its start. */}
        <span className="relative block aspect-[2/1] overflow-hidden">
          <Image
            src={images[0]}
            alt={altFor(0)}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-background/0 transition-colors duration-300 group-hover:bg-background/40">
            <span className="inline-flex translate-y-2 items-center gap-2 rounded-full border border-primary/40 bg-background/90 px-4 py-2 text-sm font-medium text-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Maximize2 size={15} className="text-primary" />
              {t('viewGallery')}
            </span>
          </span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={t('dialogLabel', {title})}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (!hasMany) return;
          if (event.key === 'ArrowLeft') step(-1);
          if (event.key === 'ArrowRight') step(1);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-6xl bg-transparent p-0 backdrop:bg-slate-950/85 backdrop:backdrop-blur-sm"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/90 p-4 md:p-6 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.75)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.24),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_40%)]" />

          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/20 p-2 text-slate-200 hover:bg-black/35 hover:text-white transition-colors"
            aria-label={t('close')}
          >
            <X size={20} />
          </button>

          <div className="relative z-10 mb-5 pr-12">
            <p className="mb-2 inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs font-medium tracking-wide text-sky-100">
              {t('label')}
            </p>
            <h3 className="text-lg md:text-2xl font-semibold text-white">
              {title}
            </h3>
          </div>

          {/* The image keeps its own proportions, so there are no letterbox bars. */}
          <div className="relative z-10 flex min-h-[30vh] items-center justify-center">
            <Image
              src={images[active]}
              alt={altFor(active)}
              width={0}
              height={0}
              sizes="(min-width: 1152px) 1104px, 95vw"
              className={`h-auto max-h-[62vh] w-auto max-w-full rounded-xl border border-white/10 shadow-2xl transition-opacity duration-200 ${
                isFading ? 'opacity-0' : 'opacity-100'
              }`}
            />

            <div className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur">
              {active + 1} / {images.length}
            </div>

            {hasMany && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2 text-slate-100 backdrop-blur hover:bg-black/70"
                  aria-label={t('previous')}
                  disabled={isFading}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2 text-slate-100 backdrop-blur hover:bg-black/70"
                  aria-label={t('next')}
                  disabled={isFading}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {hasMany && (
            <div className="relative z-10 mt-4 rounded-xl border border-white/10 bg-black/20 p-2">
              <div className="flex items-center justify-center gap-2 overflow-x-auto">
                {images.map((thumb, index) => (
                  <button
                    key={thumb}
                    type="button"
                    onClick={() => changeImage(index)}
                    className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border transition-all ${
                      active === index
                        ? 'border-sky-300 shadow-[0_0_0_1px_rgba(125,211,252,0.45)]'
                        : 'border-white/15 opacity-70 hover:opacity-100 hover:border-white/40'
                    }`}
                    aria-label={t('showScreenshot', {index: index + 1, title})}
                    aria-current={active === index}
                    disabled={isFading}
                  >
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
