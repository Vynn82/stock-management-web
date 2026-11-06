"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthError, signIn } from "@/features/auth/auth-flow.api";
import { getMe } from "@/features/auth/auth.api";
import { mapCurrentUserToUser, setTempPassword, clearTempPassword } from "@/lib/auth/session";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AuthSplit, Field, PasswordField, SubmitButton, UserIcon } from "./auth-ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const justReset = params.get("reset") === "1";
  const expired = params.get("expired") === "1";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!staffId.trim() || !password) {
      setError(new AuthError("Enter your Staff ID and password.", "validation"));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await signIn(staffId, password);
      const me = res.user ?? (await getMe(res.accessToken));

      auth.login({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        mustChangePassword: res.mustChangePassword,
        user: mapCurrentUserToUser(me),
      });

      if (res.mustChangePassword) {
        // The temporary password is the "current password" for the next step.
        setTempPassword(password);
        router.replace("/auth/new-password");
      } else {
        clearTempPassword();
        router.replace("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err
          : new AuthError("Something went wrong. Please try again.", "server"),
      );
      setPassword("");
      setLoading(false);
    }
  }

  return (
    <>
      <header className="af-head is-left">
        <h2>Welcome back</h2>
        <p>Sign in with your Staff ID to manage inventory.</p>
      </header>

      {justReset && !error && <Alert tone="success">Password updated. Sign in with your new password.</Alert>}
      {expired && !error && !justReset && <Alert tone="info">Your session ended. Please sign in again.</Alert>}
      {error && (
        <Alert tone="error">
          {error.kind === "inactive" ? (
            <>
              <strong>Account is not active.</strong> Ask your administrator to re-enable it.
            </>
          ) : error.kind === "offline" ? (
            <>
              <strong>Can&apos;t reach the server.</strong> Check your connection and try again.
            </>
          ) : (
            error.message
          )}
        </Alert>
      )}

      <form className="af-form" onSubmit={handleSubmit} noValidate>
        <Field
          autoFocus
          label="Staff ID"
          icon={<UserIcon />}
          name="staffId"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="e.g. KH0001"
          value={staffId}
          onChange={(e) => {
            setStaffId(e.target.value);
            setError(null);
          }}
          disabled={loading}
          aria-invalid={error?.kind === "invalid" || undefined}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          disabled={loading}
          aria-invalid={error?.kind === "invalid" || undefined}
          right={
            <Link className="af-link" href="/auth/forgot-password">
              Forgot password?
            </Link>
          }
        />
        <SubmitButton loading={loading}>{loading ? "Signing in…" : "Sign in"}</SubmitButton>
      </form>

      <p className="af-note">
        Accounts are created by your administrator. Can&apos;t sign in? Contact them to get access or a new temporary password.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthSplit>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthSplit>
  );
}
