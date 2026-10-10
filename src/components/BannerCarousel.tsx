import React, { useState, useEffect } from 'react';
import { Banner } from '../types';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface BannerCarouselProps {
  banners: Banner[];
  onBannerAction: (tag?: string) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  onBannerAction
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const current = banners[currentIndex];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
      {/* 
        Responsive height specifications:
        Mobile: 220px - 260px (h-[235px])
        Tablet: 260px - 320px (sm:h-[285px] md:h-[310px])
        Desktop: 320px - 380px (lg:h-[350px])
      */}
      <div className="relative w-full h-[235px] sm:h-[285px] md:h-[310px] lg:h-[350px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md group bg-slate-900 border border-slate-200/40">
        {/* Background Image - object-cover & object-center without distortion */}
        <img
          src={current.image}
          alt={current.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-all duration-700 brightness-[0.88] group-hover:scale-[1.02]"
        />

        {/* Dark Gradient Overlay for text contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent flex items-center">
          <div className="w-full max-w-xl p-4 sm:p-7 md:p-9 lg:p-12 text-white">
            {/* Promotional Badge */}
            {current.badge && (
              <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-full">
                {current.badge}
              </span>
            )}

            {/* Main Title */}
            <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug sm:leading-tight text-white drop-shadow-xs line-clamp-2">
              {current.title}
            </h2>

            {/* Subtitle */}
            {current.subtitle && (
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-xs md:text-sm text-slate-200 line-clamp-2 max-w-md">
                {current.subtitle}
              </p>
            )}

            {/* Call To Action Button */}
            <div className="mt-3 sm:mt-5">
              <button
                onClick={() => onBannerAction(current.tag)}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs sm:text-sm px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer"
              >
                <span>{current.ctaText || 'Shop Collection'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Arrows - inside the banner */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer border border-white/10 z-10"
              aria-label="Previous Banner"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer border border-white/10 z-10"
              aria-label="Next Banner"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Pagination Indicators - correctly positioned at bottom */}
        {banners.length > 1 && (
          <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 h-1.5 sm:h-2 bg-emerald-500'
                    : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
