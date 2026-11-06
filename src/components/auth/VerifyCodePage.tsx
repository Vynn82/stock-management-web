"use client";

import { ClipboardEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthError, requestResetCode, verifyResetCode } from "@/features/auth/auth-flow.api";
import { RESEND_SECONDS, readResetFlow, writeResetFlow } from "@/features/auth/reset-flow";
import { Alert, AuthCard, MailIcon, SubmitButton } from "./auth-ui";

const LENGTH = 6;

export default function VerifyCodePage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [sentAt, setSentAt] = useState(0);
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Come here only after asking for a code.
  useEffect(() => {
    const flow = readResetFlow();
    if (!flow?.staffId) {
      router.replace("/auth/forgot-password");
      return;
    }
    setStaffId(flow.staffId);
    setSentAt(flow.sentAt);
    refs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const wait = Math.max(0, Math.ceil((sentAt + RESEND_SECONDS * 1000 - now) / 1000));
  const code = digits.join("");

  const submit = useCallback(
    async (value: string) => {
      if (loading || value.length !== LENGTH || !staffId) return;
      setLoading(true);
      setError("");
      try {
        const { resetToken } = await verifyResetCode(staffId, value);
        writeResetFlow({ staffId, sentAt, resetToken });
        router.push("/auth/reset-password");
      } catch (err) {
        setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
        setDigits(Array(LENGTH).fill(""));
        setLoading(false);
        setTimeout(() => refs.current[0]?.focus(), 0);
      }
    },
    [loading, staffId, sentAt, router],
  );

  function setAt(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    setError("");
    setInfo("");
    if (!clean) {
      setDigits((d) => d.map((x, i) => (i === index ? "" : x)));
      return;
    }
    const next = [...digits];
    clean
      .slice(0, LENGTH - index)
      .split("")
      .forEach((ch, i) => {
        next[index + i] = ch;
      });
    setDigits(next);
    const last = Math.min(index + clean.length, LENGTH - 1);
    refs.current[last]?.focus();
    if (next.every(Boolean)) submit(next.join(""));
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
    else if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    else if (e.key === "ArrowRight" && index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(LENGTH).fill("");
    text.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    setError("");
    refs.current[Math.min(text.length, LENGTH - 1)]?.focus();
    if (text.length === LENGTH) submit(text);
  }

  async function resend() {
    if (wait > 0 || resending || !staffId) return;
    setResending(true);
    setError("");
    try {
      await requestResetCode(staffId);
      const t = Date.now();
      setSentAt(t);
      setNow(t);
      writeResetFlow({ staffId, sentAt: t });
      setDigits(Array(LENGTH).fill(""));
      setInfo("A new code was sent. Earlier codes no longer work.");
      refs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Could not resend the code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard
      icon={<MailIcon />}
      title="Check your email"
      subtitle={
        <>
          If <strong>{staffId || "your Staff ID"}</strong> has an email on file, we sent a 6-digit code to it. It expires in 10 minutes.
        </>
      }
      footer={
        <Link className="af-back" href="/auth/forgot-password">
          <span aria-hidden="true">←</span> Use a different Staff ID
        </Link>
      }
    >
      {error && <Alert tone="error">{error}</Alert>}
      {info && !error && <Alert tone="success">{info}</Alert>}

      <form
        className="af-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(code);
        }}
      >
        <div className="af-otp" role="group" aria-label="6-digit verification code" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              aria-label={`Digit ${i + 1} of ${LENGTH}`}
              autoComplete={i === 0 ? "one-time-code" : "off"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={LENGTH}
              value={d}
              disabled={loading}
              className={d ? "filled" : ""}
              aria-invalid={Boolean(error) || undefined}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
        <SubmitButton loading={loading} disabled={code.length !== LENGTH}>
          {loading ? "Verifying…" : "Verify code"}
        </SubmitButton>
      </form>

      <p className="af-resend">
        Didn&apos;t get it? Check spam, or{" "}
        <button type="button" onClick={resend} disabled={wait > 0 || resending}>
          {resending ? "Sending…" : "resend code"}
        </button>
        {wait > 0 && <span> in 0:{String(wait).padStart(2, "0")}</span>}
      </p>
    </AuthCard>
  );
}
