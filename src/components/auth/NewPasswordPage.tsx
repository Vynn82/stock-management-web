"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthError, changeFirstPassword, submitNewPassword } from "@/features/auth/auth-flow.api";
import { clearResetFlow, readResetFlow } from "@/features/auth/reset-flow";
import { clearTempPassword, getStoredAuth, getTempPassword } from "@/lib/auth/session";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AuthCard, LockIcon, PasswordField, PasswordMeter, SubmitButton } from "./auth-ui";

type Props = { flow: "first-login" | "reset" };

export default function NewPasswordPage({ flow }: Props) {
  const router = useRouter();
  const auth = useAuth();
  const isFirst = flow === "first-login";

  const [ready, setReady] = useState(false);
  const [needCurrent, setNeedCurrent] = useState(false);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | string | null>(null);

  // Guard: each step only makes sense after the one before it.
  useEffect(() => {
    if (isFirst) {
      const stored = getStoredAuth();
      if (!(stored?.accessToken || stored?.token)) {
        router.replace("/auth/login");
        return;
      }
      setNeedCurrent(!getTempPassword());
    } else if (!readResetFlow()?.resetToken) {
      router.replace("/auth/forgot-password");
      return;
    }
    setReady(true);
  }, [isFirst, router]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 8 && password === confirm && (!needCurrent || current.length > 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (password.length < 8) return setError("Your new password needs at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setError(null);
    setLoading(true);
    try {
      if (isFirst) {
        const currentPassword = needCurrent ? current : getTempPassword() || "";
        const res = await changeFirstPassword(currentPassword, password);
        const stored = getStoredAuth();
        auth.login({
          ...(stored ?? {}),
          accessToken: res.accessToken,
          refreshToken: res.refreshToken ?? stored?.refreshToken,
          mustChangePassword: false,
          user: stored?.user ? { ...stored.user, mustChangePassword: false } : undefined,
        });
        clearTempPassword();
        router.replace("/dashboard");
      } else {
        const token = readResetFlow()?.resetToken ?? "";
        await submitNewPassword(token, password);
        clearResetFlow();
        router.replace("/auth/login?reset=1");
      }
    } catch (err) {
      setError(err instanceof AuthError ? err : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!ready) return null;

  const errText = typeof error === "string" ? error : error?.message;
  const sessionGone = !isFirst && typeof error !== "string" && error?.kind === "validation" && /expired|start again/i.test(error.message);

  return (
    <AuthCard
      icon={<LockIcon />}
      title={isFirst ? "Create your password" : "Set a new password"}
      subtitle={
        isFirst
          ? "You signed in with a temporary password. Choose your own to continue."
          : "Choose a strong password you haven't used before."
      }
      footer={
        !isFirst && (
          <Link className="af-back" href="/auth/login">
            <span aria-hidden="true">←</span> Back to sign in
          </Link>
        )
      }
    >
      {errText && (
        <Alert tone="error">
          {errText}
          {sessionGone && (
            <>
              {" "}
              <Link className="af-link" href="/auth/forgot-password">
                Request a new code
              </Link>
            </>
          )}
        </Alert>
      )}

      <form className="af-form" onSubmit={handleSubmit} noValidate>
        {isFirst && needCurrent && (
          <PasswordField
            label="Temporary password"
            autoComplete="current-password"
            placeholder="The password you just signed in with"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setError(null);
            }}
            disabled={loading}
          />
        )}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          disabled={loading}
        />
        <PasswordMeter password={password} />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError(null);
          }}
          disabled={loading}
          aria-invalid={mismatch || undefined}
          hint={mismatch ? "The two passwords don't match." : undefined}
        />
        <SubmitButton loading={loading} disabled={!canSubmit}>
          {loading ? "Saving…" : isFirst ? "Save and continue" : "Reset password"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
