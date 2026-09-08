"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon } from "./eye-icon";
import { login, getMe } from "../auth.api";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/constants";
import {
  setTempPassword,
  clearTempPassword,
  mapCurrentUserToUser,
} from "@/lib/auth/session";

export function LoginForm() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!staffId.trim() || !password) {
      setError("Staff ID and password are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await login({ staffId: staffId.trim(), password });

      if (!res || !res.accessToken) {
        setError(
          (res as any)?.message ??
            "Unable to sign in. Please check your Staff ID and password.",
        );
        return;
      }

      // Fetch /users/me to obtain full profile, roles, permissions, and menus
      let userMustChangePassword = res.mustChangePassword;
      try {
        const me = await getMe(res.accessToken);
        const fullUser = mapCurrentUserToUser(me);
        if (typeof me.mustChangePassword === "boolean") {
          userMustChangePassword = me.mustChangePassword;
        }

        authLogin({
          ...res,
          mustChangePassword: userMustChangePassword,
          user: fullUser,
        });
      } catch (meErr) {
        console.warn("Could not fetch /users/me, using token defaults:", meErr);
        authLogin(res);
      }

      if (userMustChangePassword === true) {
        setTempPassword(password);
        router.push(ROUTES.SETUP_PASSWORD);
      } else {
        clearTempPassword();
        router.push(ROUTES.DASHBOARD);
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        axiosErr?.response?.data?.message ??
          axiosErr?.message ??
          "Unable to sign in. Please check your Staff ID and password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="split-auth-container">
      <div className="split-auth-card">
        {/* Left Brand Panel */}
        <div className="brand-panel">
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              gap: 9,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(255,255,255,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8A2 2 0 0 0 20 6.27L13 2.27A2 2 0 0 0 11 2.27L4 6.27A2 2 0 0 0 3 8V16A2 2 0 0 0 4 17.73L11 21.73A2 2 0 0 0 13 21.73L20 17.73A2 2 0 0 0 21 16Z" />
                <path d="M3.27 6.96L12 12.01L20.73 6.96" />
                <path d="M12 22.08V12" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}
            >
              StockFlow
            </span>
          </div>

          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.28,
                letterSpacing: "-0.03em",
                marginBottom: 12,
              }}
            >
              See every product,
              <br />
              every warehouse,
              <br />
              in real time.
            </div>

            <svg
              width="150"
              height="120"
              viewBox="0 0 150 120"
              style={{ opacity: 0.9, marginTop: 16 }}
              aria-hidden="true"
            >
              <rect
                x="35"
                y="40"
                width="80"
                height="60"
                rx="4"
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="2"
              />
              <path
                d="M35 55 L75 35 L115 55"
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="2"
              />
              <line
                x1="75"
                y1="35"
                x2="75"
                y2="100"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
              />
              <line
                x1="35"
                y1="55"
                x2="115"
                y2="55"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 14,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{ fontSize: 11.5, fontWeight: 700, color: "#FFFFFF" }}
              >
                Live sync
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                Every stock movement updates instantly.
              </div>
            </div>
            <div
              style={{
                width: 34,
                height: 20,
                borderRadius: 10,
                background: "var(--brand-400)",
                display: "flex",
                alignItems: "center",
                padding: 2,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  marginLeft: "auto",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="form-panel">
          <div>
            <div
              style={{
                fontSize: 23,
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.03em",
              }}
            >
              Welcome back
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--muted)",
                marginTop: 4,
              }}
            >
              Sign in with your temporary credentials to manage your inventory.
            </div>
          </div>

          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#dc2626",
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="staffId"
                style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}
              >
                Staff ID
              </label>
              <input
                id="staffId"
                className="split-input"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. STF-0001"
                autoComplete="username"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <label
                  htmlFor="password"
                  style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}
                >
                  Temporary password
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  className="split-input"
                  style={{ paddingRight: 42 }}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your temporary password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    padding: "6px 8px",
                    borderRadius: 8,
                    cursor: "pointer",
                    color: "#7b758e",
                    display: "grid",
                    placeItems: "center",
                  }}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={!show} />
                </button>
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--muted)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 4,
                  accentColor: "var(--brand-600)",
                  cursor: "pointer",
                }}
              />
              Remember me
            </label>

            <button
              className="split-submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Log in"}
            </button>

            <div
              style={{
                textAlign: "center",
                fontSize: 11.5,
                fontWeight: 500,
                color: "var(--muted)",
                lineHeight: 1.5,
                marginTop: 2,
              }}
            >
              Your administrator generated this temporary password.
              <br />
              You will create your own password after first sign-in.
            </div>

            <div
              style={{
                marginTop: 6,
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: "rgba(124, 58, 237, 0.05)",
                border: "1px dashed rgba(124, 58, 237, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-sub)",
                  lineHeight: 1.4,
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--brand-600)" }}>
                  Testing Mock:
                </span>{" "}
                <code>KH0001</code> / <code>temp123</code>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStaffId("KH0001");
                  setPassword("temp123");
                }}
                style={{
                  background: "var(--brand-600)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Auto-fill
              </button>
            </div>
          </form>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingTop: 14,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex" }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#F472B6",
                  border: "2px solid #FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                B
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#60A5FA",
                  border: "2px solid #FFFFFF",
                  marginLeft: -6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                S
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--brand-600)",
                  border: "2px solid #FFFFFF",
                  marginLeft: -6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                V
              </div>
            </div>
            <span
              style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}
            >
              Trusted by growing teams — join warehouses already using StockFlow
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
