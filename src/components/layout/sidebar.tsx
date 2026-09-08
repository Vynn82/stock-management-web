"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { UserMenuItem } from "@/types/auth";

import {
  DashboardOutlined,
  InboxOutlined,
  AppstoreOutlined,
  TagsOutlined,
  ShopOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  BarChartOutlined,
  SettingOutlined,
  DownOutlined,
  RightOutlined,
  FileTextOutlined,
  AuditOutlined,
} from "@ant-design/icons";

interface NavItem {
  id?: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: "default-dashboard",
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: <DashboardOutlined />,
  },
  {
    id: "default-my-request",
    label: "My Request",
    href: ROUTES.MY_REQUESTS,
    icon: <FileTextOutlined />,
  },
  {
    id: "default-my-approval",
    label: "My Approval",
    href: ROUTES.MY_APPROVALS,
    icon: <AuditOutlined />,
  },
];

function isSameRouteOrLabel(item: NavItem, defaultItem: NavItem): boolean {
  const cleanHref = (h: string) => h.toLowerCase().replace(/\/+$/, "");
  const cleanText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const itemHref = cleanHref(item.href);
  const defHref = cleanHref(defaultItem.href);

  if (itemHref !== "#" && itemHref === defHref) return true;

  const itemText = cleanText(item.label);
  const defText = cleanText(defaultItem.label);

  if (itemText === defText) return true;
  if (defText === "dashboard" && itemText.includes("dashboard")) return true;
  if (
    defText === "myrequest" &&
    (itemText.includes("myrequest") ||
      itemText === "requests" ||
      itemText === "request")
  ) {
    return true;
  }
  if (
    defText === "myapproval" &&
    (itemText.includes("myapproval") ||
      itemText === "approvals" ||
      itemText === "approval")
  ) {
    return true;
  }

  return false;
}

function resolveMenuIcon(
  iconName?: string | null,
  labelName?: string,
): React.ReactNode {
  const term = `${iconName || ""} ${labelName || ""}`.toLowerCase();
  if (term.includes("dash")) return <DashboardOutlined />;
  if (term.includes("my req") || term.includes("request"))
    return <FileTextOutlined />;
  if (term.includes("approv") || term.includes("sign"))
    return <AuditOutlined />;
  if (
    term.includes("prod") ||
    term.includes("pack") ||
    term.includes("box") ||
    term.includes("item") ||
    term.includes("stock")
  ) {
    return <InboxOutlined />;
  }
  if (term.includes("cat")) return <AppstoreOutlined />;
  if (term.includes("brand") || term.includes("tag")) return <TagsOutlined />;
  if (
    term.includes("ware") ||
    term.includes("shop") ||
    term.includes("store") ||
    term.includes("building") ||
    term.includes("invent")
  ) {
    return <ShopOutlined />;
  }
  if (
    term.includes("staff") ||
    term.includes("user") ||
    term.includes("team") ||
    term.includes("member")
  ) {
    return <TeamOutlined />;
  }
  if (
    term.includes("role") ||
    term.includes("shield") ||
    term.includes("guard") ||
    term.includes("access")
  ) {
    return <SafetyCertificateOutlined />;
  }
  if (term.includes("perm") || term.includes("key") || term.includes("lock")) {
    return <KeyOutlined />;
  }
  if (
    term.includes("rep") ||
    term.includes("chart") ||
    term.includes("audit") ||
    term.includes("stat")
  ) {
    return <BarChartOutlined />;
  }
  if (term.includes("set")) return <SettingOutlined />;
  return <AppstoreOutlined />;
}

function normalizePath(rawPath?: string | null): string {
  if (!rawPath || rawPath === "#") return "#";
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  // Alias backend /stock route to /products
  if (path === "/stock") return ROUTES.PRODUCTS;
  return path;
}

function transformMenuTree(items: UserMenuItem[]): NavItem[] {
  return items.map((m) => ({
    id: m.id,
    label: m.label || m.name,
    href: normalizePath(m.path),
    icon: resolveMenuIcon(m.icon, m.label || m.name),
    children:
      m.children && m.children.length > 0
        ? transformMenuTree(m.children)
        : undefined,
  }));
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, token, refreshUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proactively fetch GET /users/me if user.menus is not yet loaded
  useEffect(() => {
    let isCancelled = false;

    if (token && (!user?.menus || user.menus.length === 0)) {
      setLoading(true);
      refreshUser().finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [token, user?.menus?.length, refreshUser]);

  // Dynamic menus fetched from GET /me (user.menus)
  const dynamicItems =
    mounted && user?.menus && user.menus.length > 0
      ? transformMenuTree(user.menus)
      : [];

  // Filter out any dynamic items that duplicate default items
  const filteredDynamicItems = dynamicItems.filter((item) => {
    return !DEFAULT_NAV_ITEMS.some((def) => isSameRouteOrLabel(item, def));
  });

  // Always display default items first (Dashboard, My Request, My Approval) followed by dynamic menus
  const navItems = [...DEFAULT_NAV_ITEMS, ...filteredDynamicItems];

  function toggleExpand(key: string) {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  }

  return (
    <aside
      style={{
        width: 260,
        height: "100vh",
        maxHeight: "100vh",
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        flexShrink: 0,
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      <div className="brand" style={{ marginBottom: 32, paddingLeft: 8 }}>
        <div className="brand-mark">S</div>
        <div className="brand-name" style={{ color: "var(--text-main)" }}>
          StockFlow
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {navItems.map((item) => {
          const hasChildren = Boolean(
            item.children && item.children.length > 0,
          );
          const itemKey = item.id || item.href || item.label;
          const isChildActive = item.children?.some(
            (c) => c.href !== "#" && pathname.startsWith(c.href),
          );
          const isExactDashboard =
            item.href === ROUTES.DASHBOARD || item.href === "/dashboard";
          const isActive = isExactDashboard
            ? pathname === item.href ||
              (pathname === "/" && item.href === "/dashboard")
            : (item.href !== "#" &&
                (pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  pathname.startsWith(`${item.href}?`))) ||
              Boolean(isChildActive);
          const isExpanded = expandedItems[itemKey] ?? true;

          return (
            <div
              key={itemKey}
              style={{ display: "flex", flexDirection: "column" }}
            >
              {item.href !== "#" ? (
                <Link
                  href={item.href}
                  prefetch={true}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: "none",
                    color: isActive ? "var(--brand-600)" : "var(--text-sub)",
                    backgroundColor: isActive
                      ? "rgba(124, 58, 237, 0.1)"
                      : "transparent",
                    border: isActive
                      ? "1px solid rgba(124, 58, 237, 0.25)"
                      : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        marginRight: 10,
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  {hasChildren && (
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpand(itemKey);
                      }}
                      style={{
                        fontSize: 11,
                        opacity: 0.6,
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      {isExpanded ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  )}
                </Link>
              ) : (
                <div
                  onClick={() => toggleExpand(itemKey)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: isActive ? "var(--brand-600)" : "var(--text-sub)",
                    backgroundColor: isActive
                      ? "rgba(124, 58, 237, 0.08)"
                      : "transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        marginRight: 10,
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  {hasChildren && (
                    <span style={{ fontSize: 11, opacity: 0.6 }}>
                      {isExpanded ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  )}
                </div>
              )}

              {/* Render Submenu Children */}
              {hasChildren && isExpanded && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    marginTop: 4,
                    marginLeft: 20,
                    paddingLeft: 10,
                    borderLeft: "1px solid var(--border-color)",
                  }}
                >
                  {item.children!.map((sub) => {
                    const isSubActive =
                      sub.href !== "#" && pathname.startsWith(sub.href);
                    return (
                      <Link
                        key={sub.id || sub.href}
                        href={sub.href}
                        prefetch={true}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: isSubActive ? 600 : 500,
                          textDecoration: "none",
                          color: isSubActive
                            ? "var(--brand-600)"
                            : "var(--text-sub)",
                          backgroundColor: isSubActive
                            ? "rgba(124, 58, 237, 0.08)"
                            : "transparent",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            marginRight: 8,
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {sub.icon}
                        </span>
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Divider line below My Approval */}
              {item.id === "default-my-approval" && (
                <div
                  style={{
                    height: 1,
                    backgroundColor: "var(--border-color)",
                    margin: "10px 4px 6px",
                    opacity: 0.8,
                  }}
                />
              )}
            </div>
          );
        })}

        {loading && (!user?.menus || user.menus.length === 0) && (
          <div
            style={{
              padding: "4px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 4,
            }}
          >
            {[1, 2].map((n) => (
              <div
                key={n}
                style={{
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "rgba(124, 58, 237, 0.05)",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}
      </nav>

      <div
        style={{
          paddingTop: 16,
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <Link
          href={ROUTES.SETUP_PASSWORD}
          style={{
            display: "block",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            color: "var(--text-muted)",
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
        >
          Security & Password
        </Link>
      </div>
    </aside>
  );
}
