"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Alert, Button, Empty, Skeleton } from "antd";
import { ArrowRightOutlined, ClockCircleOutlined, DollarOutlined, ReloadOutlined, ShoppingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePendingOrders } from "@/features/customer-orders/use-pending-orders";
import type { CustomerOrderSummary } from "@/features/customer-orders/customer-orders.types";
import { PaidPill, money } from "./co-ui";

dayjs.extend(relativeTime);

const AVATAR_TONES = ["tone-a", "tone-b", "tone-c", "tone-d", "tone-e"] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function toneOf(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function dayLabel(iso: string | null): string {
  if (!iso) return "Earlier";
  const d = dayjs(iso);
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("DD MMM YYYY");
}

/**
 * Things that need a person right now. For now that is customer orders
 * waiting for review; the list refreshes by itself every 30 seconds.
 */
export default function NotificationsPage() {
  const { orders, loading, error, refresh } = usePendingOrders();

  const groups = useMemo(() => {
    const map = new Map<string, CustomerOrderSummary[]>();
    for (const o of orders) {
      const key = dayLabel(o.createdAt);
      map.set(key, [...(map.get(key) ?? []), o]);
    }
    return [...map.entries()];
  }, [orders]);

  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const oldest = orders.reduce<string | null>((acc, o) => (o.createdAt && (!acc || o.createdAt < acc) ? o.createdAt : acc), null);

  return (
    <div className="notif-page">
      <div className="notif-header">
        <div>
          <h1 className="notif-title">
            Notifications
            {orders.length > 0 && <span className="notif-count-pill">{orders.length} new</span>}
          </h1>
          <p className="notif-subtitle">New customer orders waiting for your review. Contact the customer, then accept or reject. This page updates by itself.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert type="warning" showIcon message="Could not reach the server. Showing the last known list." style={{ marginBottom: 16 }} />}

      {orders.length > 0 && (
        <div className="notif-stats">
          <div className="notif-stat">
            <span className="notif-stat-icon"><ShoppingOutlined /></span>
            <div>
              <strong>{orders.length}</strong>
              <span>Orders waiting</span>
            </div>
          </div>
          <div className="notif-stat">
            <span className="notif-stat-icon"><DollarOutlined /></span>
            <div>
              <strong>{money(totalValue)}</strong>
              <span>Total value</span>
            </div>
          </div>
          <div className="notif-stat">
            <span className="notif-stat-icon"><ClockCircleOutlined /></span>
            <div>
              <strong>{oldest ? dayjs(oldest).fromNow(true) : "—"}</strong>
              <span>Longest waiting</span>
            </div>
          </div>
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="notif-card notif-pad">
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="notif-card notif-pad">
          <Empty description="You are all caught up. No orders are waiting for review." />
        </div>
      ) : (
        groups.map(([label, rows]) => (
          <section key={label} className="notif-group" aria-label={label}>
            <h2 className="notif-group-title">
              {label} <span>{rows.length}</span>
            </h2>
            <div className="notif-card">
              <div className="notif-row notif-row-head" aria-hidden="true">
                <span>Customer</span>
                <span>Order</span>
                <span className="notif-num">Items</span>
                <span className="notif-num">Total</span>
                <span>Payment</span>
                <span>Received</span>
                <span />
              </div>
              {rows.map((o) => {
                const contact = [o.customer.company, o.customer.phone, o.customer.telegram].filter(Boolean);
                const sub = contact.find((c) => c && c !== o.customer.title) ?? "No contact info";
                return (
                  <Link key={o.id} href={`/customer-orders/${o.id}`} className="notif-row" aria-label={`Review order ${o.orderNo} from ${o.customer.title}`}>
                    <div className="notif-cell notif-customer-cell" data-label="Customer">
                      <span className={`notif-avatar ${toneOf(o.customer.title)}`} aria-hidden="true">
                        {initials(o.customer.title)}
                        <span className="notif-avatar-dot" />
                      </span>
                      <div className="notif-cell-text">
                        <strong className="notif-customer">{o.customer.title}</strong>
                        <span className="notif-cell-sub">{sub}</span>
                      </div>
                    </div>

                    <div className="notif-cell" data-label="Order">
                      <div className="notif-cell-text">
                        <strong className="notif-order-no">{o.orderNo}</strong>
                        <span className="notif-cell-sub">
                          <span className="notif-badge-new">New order</span>
                          <span>{o.fromMiniApp ? "Mini App" : "Staff"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="notif-cell notif-num" data-label="Items">
                      <strong>{o.itemCount}</strong>
                      <span className="notif-unit">{o.itemCount === 1 ? "item" : "items"}</span>
                    </div>

                    <div className="notif-cell notif-num" data-label="Total">
                      <strong className="notif-amount">{money(o.totalAmount)}</strong>
                    </div>

                    <div className="notif-cell" data-label="Payment">
                      <PaidPill paid={o.isPaid} />
                    </div>

                    <div className="notif-cell" data-label="Received">
                      <div className="notif-cell-text">
                        <strong className="notif-when">{o.createdAt ? dayjs(o.createdAt).fromNow() : "—"}</strong>
                        <span className="notif-cell-sub">{o.createdAt ? dayjs(o.createdAt).format("DD MMM YYYY, HH:mm") : ""}</span>
                      </div>
                    </div>

                    <div className="notif-cell notif-action">
                      <span className="notif-cta">
                        Review order <ArrowRightOutlined />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
