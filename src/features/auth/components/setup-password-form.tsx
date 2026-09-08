"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "./auth-shell";
import { EyeIcon } from "./eye-icon";
import { setupPassword } from "../auth.api";
import { checkPasswordStrength } from "../auth.validation";
import { ROUTES } from "@/lib/constants";
import { getTempPassword, clearTempPassword } from "@/lib/auth/session";

export function SetupPasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [closed, setClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const temp = getTempPassword();
    if (temp) {
      setCurrentPassword(temp);
    }
  }, []);

  const strength = checkPasswordStrength(newPassword, confirmPassword);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const effectiveCurrent = currentPassword.trim() || getTempPassword() || "";
    if (!effectiveCurrent) {
      setError("Current temporary password is required. Please sign in again.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (!strength.isValid) {
      setError(
        "Please meet all password requirements and ensure both passwords match.",
      );
      return;
    }

    try {
      setLoading(true);
      await setupPassword({
        currentPassword: effectiveCurrent,
        newPassword: newPassword,
      });

      clearTempPassword();
      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr?.response?.data?.message ??
          "Could not change your password. Please verify your current temporary password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell monkeyClosed={closed}>
      <h1 className="title">Create your password</h1>
      <p className="subtitle">
        Choose a private password you will use for future sign-ins.
      </p>

      <form onSubmit={submit}>
        {/* If for any reason current password wasn't saved from login, show input */}
        {!currentPassword && (
          <div className="field">
            <label className="label" htmlFor="currentPassword">
              Current temporary password
            </label>
            <div className="input-wrap">
              <input
                id="currentPassword"
                className="input"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onFocus={() => setClosed(true)}
                onBlur={() => setClosed(false)}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current temporary password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                <EyeIcon off={!showCurrent} />
              </button>
            </div>
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="newPassword">
            New password
          </label>
          <div className="input-wrap">
            <input
              id="newPassword"
              className="input"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onFocus={() => setClosed(true)}
              onBlur={() => setClosed(false)}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              <EyeIcon off={!showNew} />
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="confirmPassword">
            Confirm password
          </label>
          <div className="input-wrap">
            <input
              id="confirmPassword"
              className="input"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onFocus={() => setClosed(true)}
              onBlur={() => setClosed(false)}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter your password again"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <EyeIcon off={!showConfirm} />
            </button>
          </div>
        </div>

        <div className="requirements">
          <div className={`req ${strength.isLongEnough ? "ok" : ""}`}>
            ● At least 8 characters
          </div>
          <div className={`req ${strength.hasUppercase ? "ok" : ""}`}>
            ● One uppercase letter
          </div>
          <div className={`req ${strength.hasNumber ? "ok" : ""}`}>
            ● One number
          </div>
          <div className={`req ${strength.passwordsMatch ? "ok" : ""}`}>
            ● Passwords match
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button className="submit" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Set new password"}
        </button>
      </form>

      <div className="note">
        After this, your temporary password will no longer be used.
      </div>
    </AuthShell>
  );
}
