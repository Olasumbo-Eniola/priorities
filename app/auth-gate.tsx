"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import Dashboard from "./dashboard";
import { auth } from "./firebase-client";
import { ensureUserProfile } from "./firebase-data";

const googleProvider = new GoogleAuthProvider();

function authMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  const messages: Record<string, string> = {
    "auth/account-exists-with-different-credential":
      "An account already exists for this email with another sign-in method.",
    "auth/network-request-failed":
      "We couldn’t reach Google. Check your connection and try again.",
    "auth/operation-not-allowed":
      "Google sign-in still needs to be enabled in Firebase.",
    "auth/popup-blocked":
      "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
    "auth/popup-closed-by-user":
      "The Google sign-in window was closed before sign-in finished.",
    "auth/too-many-requests": "Too many attempts. Please try again shortly.",
    "auth/unauthorized-domain":
      "This website domain still needs to be authorized in Firebase Authentication.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}

function AuthScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <Link
          className="brand auth-brand"
          href="/"
          aria-label="Priorities home"
        >
          <span className="brand-symbol" aria-hidden="true">
            ✓
          </span>
          priorities<span className="brand-period">.</span>
        </Link>
        <div className="auth-copy">
          <p className="eyebrow">Your priorities, kept safe</p>
          <h1 id="auth-title">Welcome.</h1>
          <p>Continue with Google to pick up exactly where you left off.</p>
        </div>
        <div className="auth-form">
          {error && <p className="form-message form-error">{error}</p>}
          <button
            className="google-auth-button"
            type="button"
            disabled={busy}
            onClick={async () => {
            setBusy(true);
            setError("");
              try {
                const result = await signInWithPopup(auth, googleProvider);
                await ensureUserProfile(result.user);
              } catch (caught) {
                setError(authMessage(caught));
              } finally {
                setBusy(false);
              }
            }}
          >
            <svg aria-hidden="true" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"
              />
              <path
                fill="#FBBC05"
                d="M3.95 10.7A5.42 5.42 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.82.94 4.03l3.01-2.33Z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.66 8.66 0 0 0 9 0 9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58Z"
              />
            </svg>
            {busy ? "Connecting to Google…" : "Continue with Google"}
          </button>
          <p className="auth-assurance">
            Your task data stays private to your signed-in account.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function AuthGate() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        if (nextUser) {
          try {
            await ensureUserProfile(nextUser);
          } catch {
            // The dashboard reports Firestore setup and permission errors.
          }
        }
      }),
    [],
  );

  if (user === undefined) {
    return <div className="loading">Finding your priorities…</div>;
  }
  if (!user) return <AuthScreen />;
  return <Dashboard key={user.uid} user={user} onSignOut={() => signOut(auth)} />;
}
