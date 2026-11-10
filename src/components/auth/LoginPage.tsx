"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthError, signIn } from "@/features/auth/auth-flow.api";
import { getMe } from "@/features/auth/auth.api";
import { mapCurrentUserToUser, setTempPassword, clearTempPassword, getStoredAuth } from "@/lib/auth/session";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { Alert, AuthSplit, Field, PasswordField, SubmitButton, UserIcon } from "./auth-ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const t = useT();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const justReset = params.get("reset") === "1";
  const expired = params.get("expired") === "1";

  // Already signed in (saved session)? Skip the form and open the dashboard.
  useEffect(() => {
    const saved = getStoredAuth();
    if ((saved?.accessToken || saved?.token) && !saved.mustChangePassword && !expired) {
      router.replace("/dashboard");
    }
  }, [router, expired]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!staffId.trim() || !password) {
      setError(new AuthError(t("auth.enterBoth"), "validation"));
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
          : new AuthError(t("auth.generic"), "server"),
      );
      setPassword("");
      setLoading(false);
    }
  }

  return (
    <>
      <header className="af-head is-left">
        <h2>{t("auth.welcome")}</h2>
        <p>{t("auth.subtitle")}</p>
      </header>

      {justReset && !error && <Alert tone="success">{t("auth.resetDone")}</Alert>}
      {expired && !error && !justReset && <Alert tone="info">{t("auth.expired")}</Alert>}
      {error && (
        <Alert tone="error">
          {error.kind === "inactive" ? (
            <>
              <strong>{t("auth.inactiveTitle")}</strong> {t("auth.inactiveBody")}
            </>
          ) : error.kind === "offline" ? (
            <>
              <strong>{t("auth.offlineTitle")}</strong> {t("auth.offlineBody")}
            </>
          ) : (
            error.message
          )}
        </Alert>
      )}

      <form className="af-form" onSubmit={handleSubmit} noValidate>
        <Field
          autoFocus
          label={t("auth.staffId")}
          icon={<UserIcon />}
          name="staffId"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={t("auth.staffIdPlaceholder")}
          value={staffId}
          onChange={(e) => {
            setStaffId(e.target.value);
            setError(null);
          }}
          disabled={loading}
          aria-invalid={error?.kind === "invalid" || undefined}
        />
        <PasswordField
          label={t("auth.password")}
          name="password"
          autoComplete="current-password"
          placeholder={t("auth.passwordPlaceholder")}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          disabled={loading}
          aria-invalid={error?.kind === "invalid" || undefined}
        />
        <SubmitButton loading={loading}>{loading ? t("auth.signingIn") : t("auth.signIn")}</SubmitButton>
      </form>

      <p className="sl-forgot">
        {t("auth.forgot")} <Link href="/auth/forgot-password">{t("auth.resetIt")}</Link>
      </p>

      <p className="af-note">
        {t("auth.note")}
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
