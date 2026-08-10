import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const SWIPE_THRESHOLD = 45;

export default function ImageCarousel({
  images = [],
  title = "Hostel",
  dark = false,
  offsetTopRight = false,
  verifiedBadge = null,  
  menuButton = null,   
  placeholder = "/placeholder-hostel.jpg", 
}) {
  const list = images && images.length > 0 ? images : ["/placeholder-hostel.jpg"];
  const hasMultiple = list.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const draggedRef = useRef(false);

  const nextImage = useCallback(
    (e) => {
      e?.stopPropagation();
      setActiveIndex((i) => (i + 1) % list.length);
    },
    [list.length]
  );

  const previousImage = useCallback(
    (e) => {
      e?.stopPropagation();
      setActiveIndex((i) => (i - 1 + list.length) % list.length);
    },
    [list.length]
  );

  const goToImage = (index, e) => {
    e?.stopPropagation();
    setActiveIndex(index);
  };

  // --- Touch / swipe handling (mobile) ---
  const onTouchStart = (e) => {
    if (!hasMultiple) return;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    draggedRef.current = false;
  };

  const onTouchMove = (e) => {
    if (!hasMultiple || touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(touchDeltaX.current) > 10) draggedRef.current = true;
  };

  const onTouchEnd = () => {
    if (!hasMultiple) return;
    if (touchDeltaX.current > SWIPE_THRESHOLD) {
      previousImage();
    } else if (touchDeltaX.current < -SWIPE_THRESHOLD) {
      nextImage();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const handleImageClick = () => {
    // Only open the lightbox on a genuine tap/click, not the tail end of a swipe
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setLightboxOpen(true);
  };

  // --- Keyboard nav for lightbox (desktop) ---
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") previousImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, nextImage, previousImage]);

  return (
    <>
      <div
        className="relative h-56 w-full overflow-hidden select-none group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={list[activeIndex]}
          onClick={handleImageClick}
          className="h-full w-full object-cover cursor-pointer transition-opacity duration-300"
          alt={`${title} photo ${activeIndex + 1} of ${list.length}`}
          loading="lazy"
        />

        {/* Bottom gradient so counter/dots stay readable over bright photos */}
        {hasMultiple && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        )}

        {/* Verified badge + menu button, layered by the parent */}
        {verifiedBadge}
        {menuButton}

        {/* Image counter */}
        {hasMultiple && (
          <div
            className={`absolute right-3 ${
              offsetTopRight ? "top-14" : "top-3"
            } bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md`}
          >
            {activeIndex + 1} / {list.length}
          </div>
        )}

        {/* Desktop arrows - visible on hover */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={previousImage}
              aria-label="Previous image"
              className="hidden md:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="hidden md:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Pagination dots */}
        {hasMultiple && (
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => goToImage(i, e)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex
                    ? "w-4 bg-indigo-400"
                    : "w-1.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen lightbox */}
      {lightboxOpen && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center ${
            dark ? "bg-black/90" : "bg-black/85"
          } backdrop-blur-sm`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="Close gallery"
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
          >
            <X size={20} />
          </button>

          {hasMultiple && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              {activeIndex + 1} / {list.length}
            </div>
          )}

          <img
            src={list[activeIndex]}
            alt={`${title} photo ${activeIndex + 1} of ${list.length}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  previousImage(e);
                }}
                aria-label="Previous image"
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage(e);
                }}
                aria-label="Next image"
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}