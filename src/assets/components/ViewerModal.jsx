import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  Lock,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { getCloudinaryPdfPageUrl } from "../../services/cloudinary";

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 2.6;
const ZOOM_STEP = 0.2;

const ViewerModal = ({
  file,
  note,
  question,
  onClose,
  dark,
  isPremium,
  onDownload,
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(900);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);

  const documentSource = file || note || {};
  const documentUrl = documentSource.url || documentSource.fileUrl || "";
  const isPdfDocument = /\.pdf(\?.*)?$/i.test(documentUrl);

  const documentName =
    note?.title ||
    documentSource.name ||
    documentSource.fileName ||
    documentSource.title ||
    "PDF document";

  const documentMeta = question
    ? [question.courseCode, question.school, question.year]
    : note
      ? [note.course, note.dept, note.lecturer, note.school]
      : [];

  const documentMetaText = [
    ...documentMeta.filter(Boolean),
    documentSource.size || documentSource.fileSize
      ? `${((documentSource.size || documentSource.fileSize) / 1024).toFixed(1)} KB`
      : null,
  ]
    .filter(Boolean)
    .join(" - ");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setViewportWidth(window.innerWidth - 24);
      } else if (window.innerWidth < 1024) {
        setViewportWidth(window.innerWidth - 56);
      } else {
        setViewportWidth(980);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setPageNumber(1);
    setScale(1);
    setPageLoading(true);
    setPageError(false);
    setHasMorePages(true);
  }, [documentUrl]);

  const previewWidth = useMemo(() => {
    const baseWidth = Math.max(360, Math.min(viewportWidth, 1200));
    return Math.round(baseWidth * scale);
  }, [scale, viewportWidth]);

  const previewUrl = useMemo(() => {
    if (!documentUrl) return "";

    if (isPdfDocument) {
      return getCloudinaryPdfPageUrl(documentUrl, pageNumber, previewWidth);
    }

    return documentUrl;
  }, [documentUrl, isPdfDocument, pageNumber, previewWidth]);

  const zoomIn = () => setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  const zoomOut = () => setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));

  const nextPage = () => {
    if (!isPdfDocument || !hasMorePages) return;
    setPageNumber((current) => current + 1);
    setPageLoading(true);
    setPageError(false);
  };

  const previousPage = () => {
    if (!isPdfDocument || pageNumber === 1) return;
    setPageNumber((current) => Math.max(1, current - 1));
    setPageLoading(true);
    setPageError(false);
    setHasMorePages(true);
  };

  const dividerColor = dark ? "#1f2937" : "#e5e7eb";

  const btnMuted = {
    background: dark ? "#1f2937" : "#f3f4f6",
    color: dark ? "#9ca3af" : "#6b7280",
  };

  return (
    <div
      className="fixed inset-0 z-[504] flex items-center justify-center p-3 md:p-5"
      style={{
        background: "rgba(0,0,0,.82)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: dark ? "#0b0f1a" : "#fff",
          border: `1px solid ${dividerColor}`,
        }}
      >
        <div
          className="flex flex-col gap-4 shrink-0 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
          style={{
            borderBottom: `1px solid ${dividerColor}`,
            background: dark ? "#0d1117" : "#f9fafb",
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="rounded-lg p-2"
              style={{ background: "rgba(99,102,241,.15)" }}
            >
              <FileText size={18} className="text-indigo-400" />
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold">{documentName}</p>
              <p className="truncate text-xs opacity-60">
                {documentMetaText || "PDF document"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPdfDocument && (
              <>
                <button
                  onClick={previousPage}
                  disabled={pageNumber === 1}
                  className="rounded-lg p-2 transition disabled:opacity-40"
                  style={btnMuted}
                >
                  <ChevronLeft size={18} />
                </button>

                <div
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                  style={btnMuted}
                >
                  Page {pageNumber}
                </div>

                <button
                  onClick={nextPage}
                  disabled={!hasMorePages}
                  className="rounded-lg p-2 transition disabled:opacity-40"
                  style={btnMuted}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            <button
              onClick={zoomOut}
              className="rounded-lg p-2 transition"
              style={btnMuted}
            >
              <Minus size={18} />
            </button>

            <div
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={btnMuted}
            >
              {Math.round(scale * 100)}%
            </div>

            <button
              onClick={zoomIn}
              className="rounded-lg p-2 transition"
              style={btnMuted}
            >
              <Plus size={18} />
            </button>

            {isPremium ? (
              <button
                onClick={() => onDownload?.(documentSource)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
              >
                <Download size={16} />
                Download
              </button>
            ) : (
              <div
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
                style={{
                  background: "rgba(234,179,8,.12)",
                  color: "#ca8a04",
                }}
              >
                <Lock size={15} />
                Premium Only
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-2 transition"
              style={btnMuted}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-auto p-4 md:p-5"
          style={{
            background: dark ? "#111827" : "#f3f4f6",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y pinch-zoom",
          }}
        >
          {documentUrl ? (
            <div className="mx-auto flex min-h-full max-w-full items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
                {pageError ? (
                  <div className="flex min-h-[55vh] items-center justify-center px-6 text-center">
                    <div>
                      <p
                        className="text-lg font-semibold"
                        style={{ color: dark ? "#fff" : "#111827" }}
                      >
                        Preview unavailable
                      </p>
                      <p
                        className="mt-2 text-sm opacity-70"
                        style={{ color: dark ? "#9ca3af" : "#6b7280" }}
                      >
                        Unable to render render this page image. Try another page or download the file.
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    key={`${documentUrl}-${pageNumber}-${previewWidth}`}
                    src={previewUrl}
                    alt={`${documentName} preview page ${pageNumber}`}
                    onLoad={() => setPageLoading(false)}
                    onError={() => {
                      setPageLoading(false);
                      setPageError(true);
                      if (pageNumber > 1) {
                        setHasMorePages(false);
                      }
                    }}
                    className={`mx-auto block h-auto max-w-full rounded-2xl bg-white transition-opacity ${
                      pageLoading ? "opacity-0" : "opacity-100"
                    }`}
                    style={{
                      width: `${previewWidth}px`,
                      maxWidth: "100%",
                    }}
                  />
                )}

                {pageLoading && !pageError && (
                  <div className="absolute inset-0 flex min-h-[55vh] items-center justify-center bg-black/5">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                      <p style={{ color: dark ? "#fff" : "#111827" }}>
                        Loading preview...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p
                  className="text-lg font-semibold"
                  style={{ color: dark ? "#fff" : "#111827" }}
                >
                  No PDF attached
                </p>
                <p
                  className="mt-2 text-sm opacity-70"
                  style={{ color: dark ? "#9ca3af" : "#6b7280" }}
                >
                  This item does not include a valid document URL.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewerModal;
