"use client";

import StockFlowLockup from "@/components/common/StockFlowLockup";
import Link from "next/link";
import { ReactNode, useId, useState } from "react";

/* ---------- icons ---------- */
type IconProps = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;

export const BoxIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m12 3.8 7 4v8.4l-7 4-7-4V7.8l7-4Z" />
    <path d="m5.3 7.8 6.7 4 6.7-4M12 11.8v8" />
  </svg>
);
export const UserIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 19.5c.7-3.4 3.4-5.2 7-5.2s6.3 1.8 7 5.2" />
  </svg>
);
export const LockIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);
export const MailIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="4" y="6" width="16" height="12" rx="2" />
    <path d="m5 8 7 5 7-5" />
  </svg>
);
export const KeyIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="8.5" cy="14.5" r="3.5" />
    <path d="m11 12 8-8M16 7l2.5 2.5M14 9l2 2" />
  </svg>
);
export const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg {...base}>
    <path d="M2.8 12s3.2-5.2 9.2-5.2 9.2 5.2 9.2 5.2-3.2 5.2-9.2 5.2S2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.6" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);
export const AlertIcon = () => (
  <svg {...base}>
    <path d="M12 4.2 21 19.5H3L12 4.2Z" />
    <path d="M12 10v4.2M12 16.9v.1" />
  </svg>
);
export const CheckIcon = () => (
  <svg {...base}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const InfoIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8v.1" />
  </svg>
);
const LayersIcon = () => (
  <svg {...base}>
    <path d="m12 4 8.5 4.5L12 13 3.5 8.5 12 4Z" />
    <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
  </svg>
);
const PulseIcon = () => (
  <svg {...base}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...base}>
    <path d="M12 3.5 19 6v5.5c0 4.2-2.8 7.2-7 9-4.2-1.8-7-4.8-7-9V6l7-2.5Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

/* ---------- layout ---------- */
export function AuthBrand({ light }: { light?: boolean }) {
  return (
    <Link className="af-brand" href="/auth/login" aria-label="StockFlow">
      <StockFlowLockup size={light ? 88 : 80} light={light} />
    </Link>
  );
}

/** Centered single-card screen (forgot / verify / reset). */
export function AuthCard({
  icon,
  title,
  subtitle,
  children,
  footer,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="af-screen">
      <section className="af-card af-card-single" aria-labelledby="af-title">
        <AuthBrand />
        <span className="af-badge">{icon}</span>
        <header className="af-head">
          <h1 id="af-title">{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </header>
        {children}
        {footer && <div className="af-foot">{footer}</div>}
      </section>
    </main>
  );
}

/** Split sign-in screen with the brand panel. */
export function AuthSplit({ children }: { children: ReactNode }) {
  const points = [
    { icon: <LayersIcon />, title: "Every warehouse in one place", text: "Stock levels across all locations, always current." },
    { icon: <PulseIcon />, title: "Live stock movement", text: "In, out, transfers and adjustments as they happen." },
    { icon: <ShieldIcon />, title: "Approvals with a paper trail", text: "Requests are reviewed and recorded by role." },
  ];
  return (
    <main className="af-screen">
      <section className="af-card af-card-split" aria-label="Sign in to StockFlow">
        <aside className="af-promo">
          <AuthBrand light />
          <h1>See every product, every warehouse, in real time.</h1>
          <ul>
            {points.map((p) => (
              <li key={p.title}>
                <span className="af-promo-icon">{p.icon}</span>
                <span>
                  <strong>{p.title}</strong>
                  <small>{p.text}</small>
                </span>
              </li>
            ))}
          </ul>
        </aside>
        <div className="af-panel">{children}</div>
      </section>
    </main>
  );
}

/* ---------- form pieces ---------- */
export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  return (
    <div className={`af-alert is-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <span className="af-alert-icon">{tone === "success" ? <CheckIcon /> : tone === "info" ? <InfoIcon /> : <AlertIcon />}</span>
      <div>{children}</div>
    </div>
  );
}

export function Field({
  label,
  icon,
  hint,
  right,
  ...input
}: {
  label: string;
  icon?: ReactNode;
  hint?: string;
  right?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="af-field">
      <div className="af-label-row">
        <label htmlFor={id}>{label}</label>
        {right}
      </div>
      <div className="af-input">
        {icon && <span className="af-input-icon">{icon}</span>}
        <input id={id} {...input} className={icon ? "has-icon" : ""} />
      </div>
      {hint && <p className="af-hint">{hint}</p>}
    </div>
  );
}

export function PasswordField({
  label,
  right,
  hint,
  ...input
}: {
  label: string;
  right?: ReactNode;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="af-field">
      <div className="af-label-row">
        <label htmlFor={id}>{label}</label>
        {right}
      </div>
      <div className="af-input">
        <span className="af-input-icon">
          <LockIcon />
        </span>
        <input id={id} {...input} type={show ? "text" : "password"} className="has-icon has-action" />
        <button
          type="button"
          className="af-input-action"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          onClick={() => setShow((v) => !v)}
        >
          <EyeIcon off={show} />
        </button>
      </div>
      {hint && <p className="af-hint">{hint}</p>}
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
  ...rest
}: { loading?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="af-submit" type="submit" disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="af-spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

/* ---------- password rules ---------- */
export function passwordChecks(password: string) {
  return [
    { label: "At least 8 characters", ok: password.length >= 8, required: true },
    { label: "Upper and lower case letters", ok: /[A-Z]/.test(password) && /[a-z]/.test(password), required: false },
    { label: "A number", ok: /\d/.test(password), required: false },
    { label: "A symbol (e.g. ! @ #)", ok: /[^A-Za-z0-9]/.test(password), required: false },
  ];
}

export function PasswordMeter({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const score = password ? checks.filter((c) => c.ok).length : 0;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return (
    <div className="af-meter">
      <div className="af-meter-bar" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={score >= n ? `on s${score}` : ""} />
        ))}
      </div>
      <div className="af-meter-label" aria-live="polite">
        {password ? `Password strength: ${labels[score]}` : "Use at least 8 characters."}
      </div>
      <ul className="af-checks">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? "ok" : ""}>
            <span aria-hidden="true">{c.ok ? <CheckIcon /> : <i />}</span>
            {c.label}
            {!c.required && <em> (recommended)</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}
