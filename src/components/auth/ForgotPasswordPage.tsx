"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthError, requestResetCode } from "@/features/auth/auth-flow.api";
import { clearResetFlow, readResetFlow, writeResetFlow } from "@/features/auth/reset-flow";
import { Alert, AuthCard, Field, KeyIcon, SubmitButton, UserIcon } from "./auth-ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previous = readResetFlow();
    if (previous?.staffId) setStaffId(previous.staffId);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const id = staffId.trim();
    if (!id) {
      setError("Enter your Staff ID.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await requestResetCode(id);
      // The server answers the same way whether or not the Staff ID exists.
      const prev = readResetFlow();
      const sameId = prev?.staffId === id;
      clearResetFlow();
      writeResetFlow({ staffId: id, sentAt: sameId && prev ? prev.sentAt : Date.now() });
      router.push("/auth/verify");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthCard
      icon={<KeyIcon />}
      title="Forgot your password?"
      subtitle="Enter your Staff ID. We'll email a 6-digit code to the address on your account."
      footer={
        <Link className="af-back" href="/auth/login">
          <span aria-hidden="true">←</span> Back to sign in
        </Link>
      }
    >
      {error && <Alert tone="error">{error}</Alert>}
      <form className="af-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="Staff ID"
          icon={<UserIcon />}
          name="staffId"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          placeholder="e.g. KH0001"
          value={staffId}
          onChange={(e) => {
            setStaffId(e.target.value);
            setError("");
          }}
          disabled={loading}
        />
        <SubmitButton loading={loading}>{loading ? "Sending code…" : "Send verification code"}</SubmitButton>
      </form>
    </AuthCard>
  );
}
