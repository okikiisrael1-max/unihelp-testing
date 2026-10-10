import { useState } from "react";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { toast } from "react-toastify";

export default function GoogleMobilePasswordModal({ user, dark, onComplete, onCancel }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!user?.email) {
      setError("This Google account does not have an email address for mobile login.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential);
      toast.success("Password set. You can now log in to the mobile app with this email and password.");
      onComplete();
    } catch (linkError) {
      console.error("Could not add a mobile-login password to the Google account:", linkError);
      setError(
        linkError.code === "auth/provider-already-linked"
          ? "This account already has a password login. Use it in the mobile app."
          : linkError.code === "auth/weak-password"
            ? "Choose a stronger password with at least 8 characters."
            : linkError.code === "auth/email-already-in-use"
              ? "A password account already uses this email. Log in with that account and link Google from there."
              : linkError.message || "Could not set a password. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-mobile-password-title"
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl sm:p-8 ${
          dark ? "border border-slate-700 bg-slate-800 text-white" : "bg-white text-slate-900"
        }`}
      >
        <h2 id="google-mobile-password-title" className="text-xl font-bold">
          Set a password for mobile login
        </h2>
        <p className={`mt-2 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>
          Your Google account ({user?.email}) can then be used in the mobile app with this email and password.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`mt-1.5 w-full rounded-xl border p-3 outline-none focus:border-indigo-500 ${
                dark ? "border-slate-600 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900"
              }`}
            />
          </label>
          <label className="block text-sm font-medium">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`mt-1.5 w-full rounded-xl border p-3 outline-none focus:border-indigo-500 ${
                dark ? "border-slate-600 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900"
              }`}
            />
          </label>
          {error ? <p role="alert" className="text-sm text-red-500">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className={`rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50 ${
                dark ? "bg-white/10 hover:bg-white/15" : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              Set this later
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Set password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
