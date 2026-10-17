"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/auth/verify");
  }

  return (
    <main className="login-screen">
      <section className="forgot-card" aria-labelledby="forgot-title">
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
          </svg>
        </span>

        <header className="forgot-heading">
          <h1 id="forgot-title">Forgot your password?</h1>
          <p>No worries — enter the email linked to your account and we&apos;ll send you a link to reset it.</p>
        </header>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <label htmlFor="forgot-email">Email</label>
          <input
            autoComplete="email"
            id="forgot-email"
            name="email"
            placeholder="you@company.com"
            required
            type="email"
          />
          <button className="login-submit" type="submit">Send reset link</button>
        </form>

        <Link className="forgot-back" href="/auth/login">
          <span aria-hidden="true">←</span> Back to login
        </Link>
      </section>
    </main>
  );
}
