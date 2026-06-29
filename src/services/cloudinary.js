import { PDFDocument } from "pdf-lib";

import {
  CLOUDINARY_CONFIG,
  CLOUDINARY_BASE_URL,
  isCloudinaryConfigured,
} from "../config/cloudinary";

const PDF_MIME_TYPE = "application/pdf";

const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  pdf: 50 * 1024 * 1024,
  raw: 50 * 1024 * 1024,
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
];

const ALLOWED_PDF_TYPES = [PDF_MIME_TYPE];

const isPdfFile = (file) =>
  file?.type === PDF_MIME_TYPE ||
  file?.name?.toLowerCase().endsWith(".pdf");

export const isPreviewImageUrl = (url = "") =>
  typeof url === "string" &&
  (url.startsWith("data:image/") ||
    url.startsWith("blob:") ||
    /\.(avif|gif|jpe?g|png|webp|svg)(\?.*)?$/i.test(url));

const sanitizeAttachmentName = (value = "download.pdf") => {
  const fileName = value.split(/[\\/]/).pop() || "download.pdf";
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return safeName.replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "download.pdf";
};

const extractFileNameFromUrl = (url = "") => {
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/");
  return parts[parts.length - 1] || "download.pdf";
};

const validateFile = (file, kind) => {
  const errors = [];

  if (!isCloudinaryConfigured()) {
    errors.push(
      "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env"
    );
    return errors;
  }

  if (!file) {
    errors.push("No file provided");
    return errors;
  }

  const maxSize = FILE_SIZE_LIMITS[kind] || FILE_SIZE_LIMITS.raw;
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    errors.push(`File size (${sizeMB}MB) exceeds the ${maxMB}MB limit`);
  }

  if (kind === "image" && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push(
      `Invalid image type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`
    );
  }

  if (kind === "video" && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
    errors.push(
      `Invalid video type: ${file.type}. Allowed: MP4, WebM, OGG, MOV`
    );
  }

  if (kind === "pdf" && !ALLOWED_PDF_TYPES.includes(file.type) && !isPdfFile(file)) {
    errors.push("Only PDF files are allowed");
  }

  return errors;
};

const optimizePdfFile = async (file) => {
  try {
    const originalBytes = await file.arrayBuffer();
    const pdfDocument = await PDFDocument.load(originalBytes);
    const optimizedBytes = await pdfDocument.save({
      useObjectStreams: true,
    });

    if (optimizedBytes.byteLength >= originalBytes.byteLength) {
      return file;
    }

    return new File([optimizedBytes], file.name, {
      type: PDF_MIME_TYPE,
      lastModified: file.lastModified,
    });
  } catch (error) {
    return file;
  }
};

const uploadToCloudinary = (
  file,
  {
    resourceType,
    validationKind,
    onProgress,
  }
) => {
  return new Promise((resolve, reject) => {
    const errors = validateFile(file, validationKind);

    if (errors.length > 0) {
      reject({ errors, file, resourceType });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    const publicId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    formData.append("public_id", publicId);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);

          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            format: response.format,
            bytes: response.bytes,
            resource_type: response.resource_type,
            original_filename: file.name,
          });
        } catch (error) {
          reject({
            errors: ["Failed to parse upload response"],
            raw: xhr.responseText,
          });
        }
        return;
      }

      let message = "Upload failed";
      try {
        const errorResponse = JSON.parse(xhr.responseText);
        message = errorResponse.error?.message || message;
      } catch (_) {}

      reject({ errors: [message], status: xhr.status });
    });

    xhr.addEventListener("error", () => {
      reject({ errors: ["Network error. Check your internet connection."] });
    });

    xhr.addEventListener("abort", () => {
      reject({ errors: ["Upload was cancelled"] });
    });

    const uploadUrl = `${CLOUDINARY_BASE_URL}/${resourceType}/upload`;
    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
};

export const toCloudinaryAsset = (result, fallback = {}) => ({
  url: result?.secure_url || result?.url || fallback.url || "",
  publicId: result?.public_id || result?.publicId || fallback.publicId || "",
  resourceType:
    result?.resource_type || result?.resourceType || fallback.resourceType || "image",
});

const optimizeFileForUpload = async (file) => {
  if (isPdfFile(file)) {
    return optimizePdfFile(file);
  }

  return file;
};

export const uploadImage = async (file, onProgress) => {
  const optimizedFile = await optimizeFileForUpload(file);
  return uploadToCloudinary(optimizedFile, {
    resourceType: "image",
    validationKind: "image",
    onProgress,
  });
};

export const uploadVideo = async (file, onProgress) => {
  return uploadToCloudinary(file, {
    resourceType: "video",
    validationKind: "video",
    onProgress,
  });
};

export const uploadPDF = async (file, onProgress) => {
  const optimizedFile = await optimizePdfFile(file);

  return uploadToCloudinary(optimizedFile, {
    resourceType: "image",
    validationKind: "pdf",
    onProgress,
  });
};

export const uploadFile = async (file, onProgress) => {
  if (file?.type?.startsWith("image/")) {
    return uploadImage(file, onProgress);
  }

  if (file?.type?.startsWith("video/")) {
    return uploadVideo(file, onProgress);
  }

  if (isPdfFile(file)) {
    return uploadPDF(file, onProgress);
  }

  return uploadToCloudinary(file, {
    resourceType: "raw",
    validationKind: "raw",
    onProgress,
  });
};

export const getCloudinaryPreviewUrl = (url) => {
  if (!url) return "";
  if (!url.includes("/upload/")) return url;

  if (/\.(pdf)(\?.*)?$/i.test(url)) {
    return getCloudinaryPdfPageUrl(url, 1, 1200);
  }

  return url;
};

export const getCloudinaryPdfPageUrl = (url, page = 1, width = 1200) => {
  if (!url) return "";
  if (!/\.(pdf)(\?.*)?$/i.test(url) || !url.includes("/upload/")) {
    return url;
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeWidth = Math.max(320, Number(width) || 1200);

  return url
    .replace(
      "/upload/",
      `/upload/f_auto,q_auto,pg_${safePage},w_${safeWidth}/`
    )
    .replace(/\.pdf(\?.*)?$/i, ".jpg$1");
};

export const getCloudinaryAttachmentUrl = (url, fileName) => {
  if (!url) return "";
  if (!url.includes("/upload/")) return url;

  const attachmentName = sanitizeAttachmentName(
    fileName || extractFileNameFromUrl(url)
  );

  return url.replace(
    "/upload/",
    `/upload/fl_attachment:${attachmentName}/`
  );
};

export default uploadFile;
