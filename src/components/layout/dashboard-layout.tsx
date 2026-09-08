"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spin, Result, Button } from "antd";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/constants";
import { UserMenuItem } from "@/types/auth";

function cleanPath(raw?: string | null): string | null {
  if (!raw || raw === "#") return null;
  const clean = raw.split("?")[0].split("#")[0].trim();
  let p = clean.startsWith("/") ? clean : `/${clean}`;
  if (p === "/stock") p = ROUTES.PRODUCTS;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function extractAllowedPaths(menus: UserMenuItem[]): Set<string> {
  const paths = new Set<string>();
  paths.add(ROUTES.DASHBOARD);
  paths.add("/dashboard");
  paths.add("/");
  paths.add(ROUTES.MY_REQUESTS);
  paths.add("/my-requests");
  paths.add(ROUTES.MY_APPROVALS);
  paths.add("/my-approvals");
  paths.add("/requests");
  paths.add("/approvals");

  function traverse(items: UserMenuItem[]) {
    for (const item of items) {
      const p = cleanPath(item.path);
      if (p) {
        paths.add(p);
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    }
  }

  traverse(menus);
  return paths;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, refreshUser } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth check & profile refresh
  useEffect(() => {
    if (!mounted) return;

    if (!token) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (
      !hasFetched.current &&
      (!user?.menus || user.menus.length === 0 || !user?.profile)
    ) {
      hasFetched.current = true;
      setLoadingMenus(true);
      refreshUser().finally(() => {
        setLoadingMenus(false);
      });
    }
  }, [mounted, token, user?.menus, user?.profile, refreshUser, router]);

  const allowedPaths = useMemo(() => {
    if (!user?.menus || user.menus.length === 0) {
      return new Set<string>([ROUTES.DASHBOARD, "/dashboard", "/"]);
    }
    return extractAllowedPaths(user.menus);
  }, [user?.menus]);

  const isAuthorized = useMemo(() => {
    if (!pathname) return false;
    const currentClean = pathname.split("?")[0].split("#")[0].trim();
    const normalized =
      currentClean.length > 1 && currentClean.endsWith("/")
        ? currentClean.slice(0, -1)
        : currentClean;

    // Always allow dashboard, my-requests, my-approvals, and root
    if (
      normalized === ROUTES.DASHBOARD ||
      normalized === "/dashboard" ||
      normalized === "/" ||
      normalized === ROUTES.MY_REQUESTS ||
      normalized === "/my-requests" ||
      normalized === ROUTES.MY_APPROVALS ||
      normalized === "/my-approvals" ||
      normalized === "/requests" ||
      normalized === "/approvals"
    ) {
      return true;
    }

    // Exact match
    if (allowedPaths.has(normalized)) {
      return true;
    }

    // Sub-path match (e.g. /products/create, /products/[id] when /products is allowed)
    for (const allowed of allowedPaths) {
      if (allowed !== "/" && normalized.startsWith(`${allowed}/`)) {
        return true;
      }
    }

    return false;
  }, [pathname, allowedPaths]);

  // SSR or initial mount shell
  if (!mounted) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          backgroundColor: "var(--bg-app)",
        }}
      >
        <Sidebar />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
            height: "100vh",
            maxHeight: "100vh",
            overflow: "hidden",
          }}
        >
          <Navbar />
          <main
            style={{
              flex: 1,
              padding: "32px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflowY: "auto",
              minHeight: 0,
            }}
          >
            <Spin size="large" />
          </main>
        </div>
      </div>
    );
  }

  // Unauthenticated: redirecting
  if (!token) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "var(--bg-app)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" tip="Redirecting to login..." />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--bg-app)",
        transition: "background-color 0.25s ease",
      }}
    >
      <Sidebar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
        }}
      >
        <Navbar />
        <main
          style={{
            flex: 1,
            padding: "32px",
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
          }}
        >
          {loadingMenus ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <Spin size="large" tip="Verifying access permissions..." />
            </div>
          ) : isAuthorized ? (
            children
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "450px",
                padding: "40px 20px",
              }}
            >
              <Result
                status="403"
                title={<span style={{ color: "var(--text-main)" }}>403</span>}
                subTitle={
                  <span style={{ color: "var(--text-sub)", fontSize: 15 }}>
                    Access Denied: You do not have permission to access this
                    page ({pathname}).
                  </span>
                }
                extra={
                  <Button
                    type="primary"
                    onClick={() => router.push(ROUTES.DASHBOARD)}
                    style={{
                      backgroundColor: "var(--brand-600, #7c3aed)",
                      borderColor: "var(--brand-600, #7c3aed)",
                      borderRadius: 8,
                      height: 40,
                      padding: "0 24px",
                      fontWeight: 500,
                    }}
                  >
                    Back to Dashboard
                  </Button>
                }
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
