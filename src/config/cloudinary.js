/* =============================================
   CLOUDINARY CONFIG
   ============================================= */

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
};

export const CLOUDINARY_BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}`;

export const isCloudinaryConfigured = () => {
  return (
    CLOUDINARY_CONFIG.cloudName &&
    CLOUDINARY_CONFIG.uploadPreset
  );
};
