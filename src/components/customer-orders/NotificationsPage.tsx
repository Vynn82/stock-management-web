"use client";

import React from "react";
import Link from "next/link";
import { Alert, Button, Empty, Skeleton } from "antd";
import { CarOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePendingOrders } from "@/features/customer-orders/use-pending-orders";
import { Card, money, mutedText, pageTitle, pageWrap } from "./co-ui";

dayjs.extend(relativeTime);

/**
 * Things that need a person right now. For now that is customer orders
 * waiting for review; the list refreshes by itself every 30 seconds.
 */
export default function NotificationsPage() {
  const { orders, loading, error, refresh } = usePendingOrders();

  return (
    <div style={pageWrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>Notifications</h1>
          <p style={{ ...mutedText, margin: "4px 0 0" }}>New customer orders waiting for your review. This page updates by itself.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert type="warning" showIcon message="Could not reach the server. Showing the last known list." style={{ marginBottom: 16 }} />}

      <Card style={{ padding: 0, overflow: "hidden", maxWidth: 820 }}>
        {loading && orders.length === 0 ? (
          <div style={{ padding: 20 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 40 }}>
            <Empty description="You are all caught up. No orders are waiting for review." />
          </div>
        ) : (
          orders.map((o, i) => (
            <div
              key={o.id}
              style={{
                display: "flex",
                gap: 14,
                padding: "16px 18px",
                borderBottom: i === orders.length - 1 ? "none" : "1px solid var(--card-border)",
                background: "rgba(124,58,237,0.05)",
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  flex: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(124,58,237,0.12)",
                  color: "var(--purple)",
                  fontSize: 18,
                }}
              >
                <CarOutlined />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong style={{ fontSize: 13.5 }}>New customer order {o.orderNo}</strong>
                  <span style={{ ...mutedText, fontSize: 12, whiteSpace: "nowrap" }}>{o.createdAt ? dayjs(o.createdAt).fromNow() : ""}</span>
                </div>
                <div style={{ ...mutedText, marginTop: 2 }}>
                  {o.customer.title} ordered {o.itemCount} {o.itemCount === 1 ? "item" : "items"}, {money(o.totalAmount)}. Contact the customer, then accept or reject.
                </div>
                <div style={{ marginTop: 10 }}>
                  <Link href={`/customer-orders/${o.id}`}>
                    <Button size="small" type="primary">
                      Review order
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
