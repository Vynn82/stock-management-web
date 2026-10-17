"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getPasswordStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

type NewPasswordPageProps = {
  flow: "first-login" | "reset";
};

export default function NewPasswordPage({ flow }: NewPasswordPageProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  const strength = getPasswordStrength(password);
  const strengthLabel = ["", "Too weak — use at least 8 characters", "Fair — add uppercase letters or numbers", "Good — add a symbol to make it strong", "Strong password"];
  const isFirstLogin = flow === "first-login";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="login-screen">
      <section className="new-password-card" aria-labelledby="new-password-title">
        <Link className="forgot-brand" href="/auth/login" aria-label="StockFlow login">
          <span className="forgot-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m12 3.8 7 4v8.4l-7 4-7-4V7.8l7-4Z" />
              <path d="m5.3 7.8 6.7 4 6.7-4M12 11.8v8" />
            </svg>
          </span>
          <span>StockFlow</span>
        </Link>

        <span className="forgot-lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5.5" y="10" width="13" height="10" rx="1.5" />
            <path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" />
            <circle cx="12" cy="14.5" r=".8" />
            <path d="M12 15.3v1.6" />
          </svg>
        </span>

        <header className="new-password-heading">
          <h1 id="new-password-title">{isFirstLogin ? "New Password" : "Reset Password"}</h1>
          <p>
            {isFirstLogin
              ? "Create a new password for your account."
              : "Choose a strong password you haven't used before."}
          </p>
        </header>

        <form className="new-password-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">New password</label>
          <div className="password-input-wrap">
            <input
              autoComplete="new-password"
              id="new-password"
              minLength={8}
              onChange={(event) => { setPassword(event.target.value); setMessage(""); }}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              className="password-visibility"
              type="button"
              aria-label={showPassword ? "Hide new password" : "Show new password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <EyeIcon />
            </button>
          </div>

          <div className="password-strength" aria-label={`Password strength: ${strengthLabel[strength] || "Not set"}`}>
            <span className={strength > 0 ? `strength-fill strength-${strength}` : ""} />
          </div>
          <p className={`strength-hint${strength >= 3 ? " is-good" : ""}`}>
            {password ? strengthLabel[strength] || "Use at least 8 characters" : ""}
          </p>

          <label htmlFor="confirm-password">Confirm password</label>
          <div className="password-input-wrap">
            <input
              autoComplete="new-password"
              id="confirm-password"
              onChange={(event) => { setConfirmPassword(event.target.value); setMessage(""); }}
              required
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
            />
            <button
              className="password-visibility"
              type="button"
              aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
              aria-pressed={showConfirmPassword}
              onClick={() => setShowConfirmPassword((visible) => !visible)}
            >
              <EyeIcon />
            </button>
          </div>

          {message && <p className="new-password-message" role="status">{message}</p>}
          <button className="login-submit new-password-submit" type="submit">
            {isFirstLogin ? "Set password" : "Reset password"}
          </button>
        </form>
      </section>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.8 12s3.2-5.2 9.2-5.2 9.2 5.2 9.2 5.2-3.2 5.2-9.2 5.2S2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}
