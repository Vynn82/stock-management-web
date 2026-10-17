"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  AppstoreOutlined,
  BarChartOutlined,
  BoxPlotOutlined,
  CalendarOutlined,
  CaretDownOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HomeOutlined,
  MenuOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { DatePicker } from "antd";
import QuickThemeToggle from "@/components/dashboard/QuickThemeToggle";
import { useTheme } from "@/providers/ThemeProvider";

const primary = [
  { label: "Dashboard", href: "/dashboard", icon: <AppstoreOutlined /> },
  { label: "Products", href: "/products", icon: <BoxPlotOutlined /> },
  { label: "Stock", href: "/stock", icon: <HomeOutlined /> },
  { label: "Purchasing", href: "/purchasing", icon: <ShopOutlined /> },
  { label: "Manage", href: "/manage/categories", icon: <DatabaseOutlined /> },
  {
    label: "Requests",
    href: "/requests",
    icon: <FileTextOutlined />,
    badge: 7,
  },
  { label: "Reports", href: "/reports", icon: <BarChartOutlined /> },
  { label: "Users", href: "/users", icon: <TeamOutlined /> },
];
const secondary = [
  { label: "Settings", href: "/settings", icon: <SettingOutlined /> },
];

export default function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const showDashboardTools =
    pathname === "/dashboard" || pathname === "/dashboard/dashboard";
  const showTopbar = showDashboardTools;
  const [open, setOpen] = useState(false);
  const [manageExpanded, setManageExpanded] = useState(
    pathname.startsWith("/manage") || pathname.startsWith("/suppliers/"),
  );
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const cancelSignOutRef = useRef<HTMLButtonElement>(null);
  const signOutTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pathname.startsWith("/manage") || pathname.startsWith("/suppliers/"))
      setManageExpanded(true);
  }, [pathname]);

  useEffect(() => {
    if (!confirmSignOut) return;

    cancelSignOutRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConfirmSignOut(false);
        signOutTriggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmSignOut]);

  return (
    <>
      <div
        className={`app-shell ${pathname === "/requests" || pathname.startsWith("/requests/") ? "requests-shell" : ""} ${pathname.startsWith("/manage") ? "manage-shell" : ""} ${pathname.startsWith("/suppliers/") ? "supplier-detail-shell manage-shell" : ""} ${pathname.startsWith("/users") ? "users-shell" : ""} ${pathname.startsWith("/users/invite") ? "users-invite-shell" : ""} ${pathname === "/stock" || pathname.startsWith("/stock") ? "stock-shell" : ""}`}
      >
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <div className="brand">
            <span className="brand-mark">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </span>
            <span>StockFlow</span>
          </div>
          <nav className="nav-group">
            {primary.map((item) =>
              item.label === "Manage" ? (
                <div key={item.label}>
                  <button
                    className={`nav-item ${pathname.startsWith("/manage") || pathname.startsWith("/suppliers/") ? "active" : ""}`}
                    type="button"
                    aria-expanded={manageExpanded}
                    onClick={() => setManageExpanded((expanded) => !expanded)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <CaretDownOutlined
                      className={`manage-chevron ${manageExpanded ? "expanded" : ""}`}
                    />
                  </button>
                  {manageExpanded && (
                    <div className="manage-subnav">
                      <NavItem
                        label="Categories"
                        href="/manage/categories"
                        icon={<span className="manage-bullet">•</span>}
                        active={pathname === "/manage/categories"}
                      />
                      <NavItem
                        label="Suppliers"
                        href="/manage/suppliers"
                        icon={<span className="manage-bullet">•</span>}
                        active={
                          pathname === "/manage/suppliers" ||
                          pathname.startsWith("/suppliers/")
                        }
                      />
                      <NavItem
                        label="Warehouses"
                        href="/manage/warehouses"
                        icon={<span className="manage-bullet">•</span>}
                        active={pathname === "/manage/warehouses"}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <NavItem
                  key={item.label}
                  {...item}
                  active={
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                  }
                />
              ),
            )}
          </nav>
          <div className="nav-divider" />
          <nav className="nav-group">
            {secondary.map((item) => (
              <NavItem
                key={item.label}
                {...item}
                active={
                  item.href !== "/" &&
                  (pathname === item.href ||
                    pathname.startsWith(`${item.href}/`))
                }
              />
            ))}
            <button
              ref={signOutTriggerRef}
              className="nav-item"
              type="button"
              onClick={() => setConfirmSignOut(true)}
            >
              <LogoutOutlined />
              <span>Sign out</span>
            </button>
          </nav>
          <div className="sidebar-bottom">
            <div className="support-card">
              <strong>Need help?</strong>
              <p>Our support team replies within an hour.</p>
              <button>Contact support</button>
            </div>
          </div>
        </aside>
        <main className="main-area">
          {showTopbar && (
            <header className="topbar">
              <button
                className="mobile-menu"
                onClick={() => setOpen(!open)}
                aria-label="Open navigation"
              >
                <MenuOutlined />
              </button>
              <div />
              {showDashboardTools && (
                <div className="topbar-right">
                  <QuickThemeToggle />
                  <DatePicker.RangePicker
                    className="date-picker"
                    classNames={{
                      popup: {
                        root: `date-range-popup ${theme === "dark" ? "dark-date-range-popup" : ""}`,
                      },
                    }}
                    defaultValue={[dayjs("2026-08-01"), dayjs("2026-08-21")]}
                    format="DD.MM.YYYY"
                    separator="–"
                    suffixIcon={<CalendarOutlined />}
                    allowClear={false}
                    inputReadOnly
                    aria-label="Select date range"
                  />
                  <div className="avatar">VK</div>
                </div>
              )}
            </header>
          )}
          {children}
        </main>
      </div>
      {confirmSignOut && (
        <div
          className="signout-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmSignOut(false);
              signOutTriggerRef.current?.focus();
            }
          }}
        >
          <section
            className="signout-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            aria-describedby="signout-description"
          >
            <span className="signout-icon" aria-hidden="true">
              <LogoutOutlined />
            </span>
            <h2 id="signout-title">Sign out of StockFlow?</h2>
            <p id="signout-description">
              You&apos;ll need to sign in again to access your dashboard.
            </p>
            <div className="signout-actions">
              <button
                ref={cancelSignOutRef}
                className="signout-cancel"
                type="button"
                onClick={() => {
                  setConfirmSignOut(false);
                  signOutTriggerRef.current?.focus();
                }}
              >
                Cancel
              </button>
              <button
                className="signout-confirm"
                type="button"
                onClick={() => router.push("/auth/login")}
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function NavItem({
  label,
  href,
  icon,
  active,
  badge,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link className={`nav-item ${active ? "active" : ""}`} href={href}>
      {icon}
      <span>{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </Link>
  );
}
