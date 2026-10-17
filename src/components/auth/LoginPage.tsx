"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [liveSync, setLiveSync] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/auth/new-password");
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-label="Sign in to StockFlow">
        <aside className="login-promo">
          <a className="login-brand" href="/dashboard" aria-label="StockFlow home">
            <span className="login-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m12 3.8 7 4v8.4l-7 4-7-4V7.8l7-4Z" />
                <path d="m5.3 7.8 6.7 4 6.7-4M12 11.8v8" />
              </svg>
            </span>
            <span>StockFlow</span>
          </a>

          <h1>See every product,<br />every warehouse,<br />in real time.</h1>

          <svg className="warehouse-illustration" viewBox="0 0 100 82" fill="none" aria-hidden="true">
            <path d="m14 25 36-17 36 17v45H14V25Z" />
            <path d="M14 25h72M50 8v62M14 25l36-4 36 4" />
          </svg>

          <button
            className="live-sync-card"
            type="button"
            role="switch"
            aria-checked={liveSync}
            onClick={() => setLiveSync((enabled) => !enabled)}
          >
            <span className="live-sync-copy">
              <strong>Live sync</strong>
              <span>Every stock movement updates instantly.</span>
            </span>
            <span className={`live-sync-switch${liveSync ? " is-on" : ""}`} aria-hidden="true">
              <span />
            </span>
          </button>
        </aside>

        <div className="login-form-panel">
          <header className="login-heading">
            <h2>Welcome back</h2>
            <p>Sign in to manage your inventory.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              autoComplete="email"
              id="login-email"
              name="email"
              placeholder="you@company.com"
              required
              type="email"
            />

            <div className="login-password-label">
              <label htmlFor="login-password">Password</label>
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </div>
            <input
              autoComplete="current-password"
              id="login-password"
              name="password"
              placeholder="Enter your password"
              required
              type="password"
            />

            <label className="remember-me">
              <input name="remember" type="checkbox" />
              <span>Remember me</span>
            </label>

            <button className="login-submit" type="submit">Log in</button>
          </form>

          <p className="login-signup">Don&apos;t have an account? <a href="#sign-up">Sign up</a></p>

          <div className="login-trust">
            <div className="team-avatars" aria-hidden="true">
              <span>L</span><span>S</span><span>V</span>
            </div>
            <p>Trusted by growing teams — join warehouses already using StockFlow</p>
          </div>
        </div>
      </section>
    </main>
  );
}
