import { auth } from "../firebase/config";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const requestCleanupDelete = async (path) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Please log in before deleting this item.");

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/media-cleanup${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.error || "Delete failed. Please try again.");
  }

  return data;
};

export const deleteMediaDocument = (type, id) =>
  requestCleanupDelete(`/documents/${encodeURIComponent(type)}/${encodeURIComponent(id)}`);

export const deleteGroupPostWithMedia = (groupId, postId) =>
  requestCleanupDelete(
    `/groups/${encodeURIComponent(groupId)}/posts/${encodeURIComponent(postId)}`
  );

export const deleteGroupWithMedia = (groupId) =>
  requestCleanupDelete(`/groups/${encodeURIComponent(groupId)}`);

export const deleteCurrentUserWithMedia = () => requestCleanupDelete("/users/me");
