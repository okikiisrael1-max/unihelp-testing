import { useEffect, useState } from "react";
import { db, auth } from "../../firebase/config";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function ReviewSection({ tutorialId, dark }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchReviews = async () => {
    const q = query(
      collection(db, "reviews"),
      where("tutorialId", "==", tutorialId)
    );

    const snap = await getDocs(q);
    setReviews(snap.docs.map(d => d.data()));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const submitReview = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId || !tutorialId) return;
    await setDoc(doc(db, "reviews", `${tutorialId}_${userId}`), {
      tutorialId,
      userId,
      rating,
      comment,
      createdAt: serverTimestamp(),
    }, { merge: true });

    fetchReviews();
  };

  return (
    <div className={`mt-4 ${dark ? "text-white" : ""}`}>
      <h3 className="font-bold mb-2">⭐ Reviews</h3>

      {reviews.map((r, i) => (
        <div key={i} className="mb-2 border-b pb-2">
          <p>⭐ {r.rating}/5</p>
          <p className="text-sm">{r.comment}</p>
        </div>
      ))}

      <div className="mt-3">
        <input
          type="number"
          min="1"
          max="5"
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
          className="input"
        />

        <input
          placeholder="Write review..."
          onChange={e => setComment(e.target.value)}
          className="input"
        />

        <button
          onClick={submitReview}
          className="bg-yellow-500 px-3 py-1 rounded"
        >
          Submit
        </button>
      </div>
    </div>
  );
}