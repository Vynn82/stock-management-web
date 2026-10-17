"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CODE_LENGTH = 6;

export default function VerifyCodePage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [message, setMessage] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setCode((current) => current.map((digit, digitIndex) => digitIndex === index ? "" : digit));
      return;
    }

    const pastedDigits = digits.slice(0, CODE_LENGTH - index).split("");
    setCode((current) => {
      const next = [...current];
      pastedDigits.forEach((digit, digitIndex) => { next[index + digitIndex] = digit; });
      return next;
    });
    inputRefs.current[Math.min(index + pastedDigits.length, CODE_LENGTH - 1)]?.focus();
    setMessage("");
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleVerify() {
    router.push("/auth/reset-password");
  }

  return (
    <main className="login-screen">
      <section className="verify-card" aria-labelledby="verify-title">
        <Link className="forgot-brand" href="/auth/login" aria-label="StockFlow login">
          <span className="forgot-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m12 3.8 7 4v8.4l-7 4-7-4V7.8l7-4Z" />
              <path d="m5.3 7.8 6.7 4 6.7-4M12 11.8v8" />
            </svg>
          </span>
          <span>StockFlow</span>
        </Link>

        <span className="verify-mail-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="4.5" y="6.5" width="15" height="11" rx="1.5" />
            <path d="m5.5 8 6.5 5 6.5-5" />
          </svg>
        </span>

        <header className="verify-heading">
          <h1 id="verify-title">Enter verification code</h1>
          <p>We sent a 6-digit code to <strong>so***@company.com</strong></p>
        </header>

        <div className="verify-code" role="group" aria-label="6-digit verification code">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(element) => { inputRefs.current[index] = element; }}
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              className={digit ? "has-digit" : ""}
              inputMode="numeric"
              maxLength={CODE_LENGTH}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event.key)}
              value={digit}
            />
          ))}
        </div>

        <button className="login-submit verify-submit" type="button" onClick={handleVerify}>
          Verify code
        </button>
        {message && <p className="verify-message" role="status">{message}</p>}

        <p className="verify-resend">Didn&apos;t get a code? <button type="button" onClick={() => setMessage("Resending codes isn’t connected yet.")}>Resend</button> in 00:47</p>
      </section>
    </main>
  );
}
