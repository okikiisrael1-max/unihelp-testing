import { auth } from "../firebase/config";

const API_URL = (import.meta.env.VITE_API_URL || "https://unihelp-backend-vdps.onrender.com").replace(/\/$/, "");

const authHeaders = async (json = true) => {
  const headers = json ? { "Content-Type": "application/json" } : {};
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const parse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
};

export const getJson = async (path) =>
  parse(await fetch(`${API_URL}${path}`, { headers: await authHeaders() }));

export const postJson = async (path, payload) =>
  parse(await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  }));

export const putJson = async (path, payload) =>
  parse(await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  }));

export const patchJson = async (path, payload) =>
  parse(await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  }));

export const deleteJson = async (path) =>
  parse(await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: await authHeaders(),
  }));

export const uploadVoiceMessage = async (file, { conversationId, duration = 0 } = {}) => {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("conversationId", conversationId || "");
  formData.append("duration", String(duration));
  return parse(await fetch(`${API_URL}/api/voice/upload`, {
    method: "POST",
    headers: await authHeaders(false),
    body: formData,
  }));
};

export const uploadFeatureMedia = async (file, { feature, resourceType = "image", onProgress } = {}) => {
  const headers = await authHeaders(false);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("feature", feature);
  formData.append("resourceType", resourceType);

  const data = await parse(await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    headers,
    body: formData,
  }));
  if (onProgress) onProgress(100);
  return data;
};

export const toR2Asset = (upload, fallback = {}) => ({
  url: upload?.url || upload?.secure_url || fallback.url || "",
  publicId: upload?.publicId || upload?.key || fallback.publicId || "",
  resourceType: upload?.resourceType || upload?.resource_type || fallback.resourceType || "image",
  storageProvider: upload?.storageProvider || "r2",
});

export const deleteProfileMedia = async (key) => {
  if (typeof key !== "string" || !key.startsWith("unihelp/profile/") || key.includes("..")) {
    throw new Error("Invalid profile media key.");
  }
  return parse(await fetch(`${API_URL}/api/uploads`, {
    method: "DELETE",
    headers: await authHeaders(),
    body: JSON.stringify({ key }),
  }));
};
