"use client";

import Link from "next/link";
import StockFlowLogo from "@/components/common/StockFlowLogo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  AppstoreOutlined,
  BarChartOutlined,
  BoxPlotOutlined,
  CalendarOutlined,
  BellOutlined,
  CarOutlined,
  ContactsOutlined,
  CaretDownOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HomeOutlined,
  MenuOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  LockOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Modal, notification } from "antd";
import { useAuth } from "@/hooks/use-auth";
import { checkAccess } from "@/lib/auth/route-access";
import AccessDenied from "@/components/common/AccessDenied";
import { usePendingOrders } from "@/features/customer-orders/use-pending-orders";
import { usePendingRequests } from "@/features/requests/use-pending-requests";
import QuickThemeToggle from "@/components/dashboard/QuickThemeToggle";
import { useTheme } from "@/providers/ThemeProvider";
import { useT, type MessageKey } from "@/lib/i18n";
import LocaleSwitcher from "@/components/common/LocaleSwitcher";

const primary = [
  { label: "Dashboard", labelKey: "nav.dashboard", href: "/dashboard", icon: <AppstoreOutlined /> },
  { label: "Products", labelKey: "nav.products", href: "/products", icon: <BoxPlotOutlined /> },
  { label: "Stock", labelKey: "nav.stock", href: "/stock", icon: <HomeOutlined /> },
  { label: "Purchasing", labelKey: "nav.purchasing", href: "/purchasing", icon: <ShopOutlined /> },
  { label: "Customer Orders", labelKey: "nav.customerOrders", href: "/customer-orders", icon: <CarOutlined /> },
  { label: "Customers", labelKey: "nav.customers", href: "/customers", icon: <ContactsOutlined /> },
  { label: "Manage", labelKey: "nav.manage", href: "/manage/categories", icon: <DatabaseOutlined /> },
  {
    label: "Requests",
    labelKey: "nav.requests",
    href: "/requests",
    icon: <FileTextOutlined />,
  },
  { label: "Reports", labelKey: "nav.reports", href: "/reports", icon: <BarChartOutlined /> },
  { label: "Users", labelKey: "nav.users", href: "/users", icon: <TeamOutlined /> },
] satisfies { label: string; labelKey: MessageKey; href: string; icon: React.ReactNode }[];
const secondary = [
  { label: "Notifications", labelKey: "nav.notifications", href: "/notifications", icon: <BellOutlined /> },
  { label: "Settings", labelKey: "nav.settings", href: "/settings", icon: <SettingOutlined /> },
] satisfies { label: string; labelKey: MessageKey; href: string; icon: React.ReactNode }[];

export default function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const t = useT();
  const { user, token, logout } = useAuth();
  const roleName = user?.role || user?.roles?.[0];
  // No saved login (never signed in, or the session could not be renewed): go to sign-in.
  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [token, router]);
  const access = checkAccess(user, pathname);
  // Clicking a menu the role can't use shows a popup instead of opening the screen.
  const lockedOf = (href: string) => {
    const r = checkAccess(user, href);
    return r.allowed ? undefined : () => {
      Modal.warning({
        title: t("access.title"),
        centered: true,
        okText: t("access.gotIt"),
        content: (
          <div>
            <p style={{ margin: "0 0 6px" }}>
              {roleName ? t("access.noPermissionRole", { role: roleName }) : t("access.noPermission")} <strong>{r.feature}</strong>.
            </p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 12.5 }}>
              {t("access.askPre")} <strong>{r.needs.join(t("access.or"))}</strong> {t("access.askPost")}
            </p>
          </div>
        ),
      });
    };
  };
  // Customer orders waiting for review: badge in the sidebar, and a banner
  // when a new one arrives while someone is on the site.
  const { unseenCount: pendingOrders } = usePendingOrders((fresh) => {
    const first = fresh[0];
    notification.info({
      key: "new-customer-order",
      message: fresh.length > 1 ? t("order.newMany", { n: fresh.length }) : t("order.newOne"),
      description:
        fresh.length > 1
          ? t("order.descMany")
          : t("order.descOne", { customer: first.customer.title, order: first.orderNo }),
      placement: "topRight",
      duration: 8,
      btn: (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            notification.destroy("new-customer-order");
            router.push(fresh.length > 1 ? "/customer-orders" : `/customer-orders/${first.id}`);
          }}
        >
          {t("order.review")}
        </Button>
      ),
    });
  });
  // Requests waiting for this person's decision.
  const pendingRequests = usePendingRequests(pathname);
  const navPrimary = primary.map((item) =>
    item.href === "/customer-orders"
      ? { ...item, badge: pendingOrders || undefined }
      : item.href === "/requests"
        ? { ...item, badge: pendingRequests || undefined }
        : item,
  );
  const navSecondary = secondary.map((item) =>
    item.href === "/notifications" ? { ...item, badge: pendingOrders || undefined } : item,
  );
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
        className={`app-shell ${pathname === "/settings" || pathname.startsWith("/settings") ? "settings-shell requests-shell" : ""} ${pathname === "/reports" || pathname.startsWith("/reports") ? "reports-shell requests-shell" : ""} ${pathname === "/purchasing" || pathname.startsWith("/purchasing") ? "purchasing-shell requests-shell" : ""} ${pathname === "/requests" || pathname.startsWith("/requests/") ? "requests-shell" : ""} ${pathname.startsWith("/manage") ? "manage-shell" : ""} ${pathname.startsWith("/suppliers/") ? "supplier-detail-shell manage-shell" : ""} ${pathname.startsWith("/users") ? "users-shell" : ""} ${pathname.startsWith("/users/invite") ? "users-invite-shell" : ""} ${pathname === "/stock" || pathname.startsWith("/stock") ? "stock-shell" : ""}`}
      >
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <div className="brand">
            <StockFlowLogo size={30} />
            <span>StockFlow</span>
          </div>
          <nav className="nav-group">
            {navPrimary.map((item) =>
              item.label === "Manage" ? (
                <div key={item.label}>
                  <button
                    className={`nav-item ${pathname.startsWith("/manage") || pathname.startsWith("/suppliers/") ? "active" : ""}`}
                    type="button"
                    aria-expanded={manageExpanded}
                    onClick={() => setManageExpanded((expanded) => !expanded)}
                  >
                    {item.icon}
                    <span>{t(item.labelKey)}</span>
                    <CaretDownOutlined
                      className={`manage-chevron ${manageExpanded ? "expanded" : ""}`}
                    />
                  </button>
                  {manageExpanded && (
                    <div className="manage-subnav">
                      <NavItem
                        label={t("nav.categories")}
                        href="/manage/categories"
                        icon={<span className="manage-bullet">•</span>}
                        active={pathname === "/manage/categories"}
                      />
                      <NavItem
                        label={t("nav.brands")}
                        href="/manage/brands"
                        onLocked={lockedOf("/manage/brands")}
                        icon={<span className="manage-bullet">•</span>}
                        active={pathname === "/manage/brands"}
                      />
                      <NavItem
                        label={t("nav.suppliers")}
                        href="/manage/suppliers"
                        onLocked={lockedOf("/manage/suppliers")}
                        icon={<span className="manage-bullet">•</span>}
                        active={
                          pathname === "/manage/suppliers" ||
                          pathname.startsWith("/suppliers/")
                        }
                      />
                      <NavItem
                        label={t("nav.warehouses")}
                        href="/manage/warehouses"
                        onLocked={lockedOf("/manage/warehouses")}
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
                  label={t(item.labelKey)}
                  onLocked={lockedOf(item.href)}
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
            {navSecondary.map((item) => (
              <NavItem
                key={item.label}
                {...item}
                label={t(item.labelKey)}
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
              <span>{t("nav.signOut")}</span>
            </button>
          </nav>
          <div className="sidebar-bottom">
            <div className="support-card">
              <strong>{t("support.title")}</strong>
              <p>{t("support.body")}</p>
              <button type="button" onClick={() => router.push("/help")}>{t("support.contact")}</button>
            </div>
          </div>
        </aside>
        <main className="main-area">
          {showTopbar && (
            <header className="topbar">
              <button
                className="mobile-menu"
                onClick={() => setOpen(!open)}
                aria-label={t("nav.openNavigation")}
              >
                <MenuOutlined />
              </button>
              <div />
              {showDashboardTools && (
                <div className="topbar-right">
                  <LocaleSwitcher />
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
                    aria-label={t("header.selectDateRange")}
                  />
                  <button type="button" className="avatar avatar-button" aria-label={t("header.openProfile")} title={t("header.profile")} onClick={() => router.push("/settings/profile")}>VK</button>
                </div>
              )}
            </header>
          )}
          {access.allowed ? children : <AccessDenied feature={access.feature} needs={access.needs} role={roleName} />}
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
            <h2 id="signout-title">{t("signout.title")}</h2>
            <p id="signout-description">
              {t("signout.body")}
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
                {t("common.cancel")}
              </button>
              <button
                className="signout-confirm"
                type="button"
                onClick={() => {
                  logout();
                  router.push("/auth/login");
                }}
              >
                {t("nav.signOut")}
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
  onLocked,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
  onLocked?: () => void;
}) {
  const t = useT();
  if (onLocked) {
    return (
      <Link
        className={`nav-item ${active ? "active" : ""}`}
        href={href}
        aria-disabled="true"
        title={t("nav.noAccess")}
        style={{ opacity: 0.6 }}
        onClick={(e) => {
          e.preventDefault();
          onLocked();
        }}
      >
        {icon}
        <span>{label}</span>
        <LockOutlined style={{ marginLeft: "auto", fontSize: 12 }} />
      </Link>
    );
  }
  return (
    <Link className={`nav-item ${active ? "active" : ""}`} href={href}>
      {icon}
      <span>{label}</span>
      {badge ? <span className="nav-badge">{badge > 99 ? "99+" : badge}</span> : null}
    </Link>
  );
}
