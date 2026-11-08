"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Skeleton, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EnvironmentOutlined, PhoneOutlined, ReloadOutlined, SendOutlined } from "@ant-design/icons";
import BackButton from "@/components/ui/BackButton";
import { errorText, fetchCustomer, fetchCustomerOrders } from "@/features/customer-orders/customer-orders.api";
import type { CoStatus, CustomerOrderSummary, CustomerRow } from "@/features/customer-orders/customer-orders.types";
import { Card, PaidPill, StatusPill, dateTime, money, mutedText, pageTitle, pageWrap, qty } from "@/components/customer-orders/co-ui";
import { CustomerStatusPill, TierChip } from "./customer-ui";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 150px", minWidth: 140 }}>
      <div style={{ ...mutedText, fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 13.5 }}>
      <span style={mutedText}>{label}</span>
      <span style={{ textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>{children}</span>
    </div>
  );
}

export default function CustomerDetailPage({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, o] = await Promise.all([fetchCustomer(customerId), fetchCustomerOrders(undefined, customerId)]);
      setCustomer(c);
      setOrders(o);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<CustomerOrderSummary> = [
    { title: "Order", dataIndex: "orderNo", render: (v: string) => <strong style={{ color: "var(--ink)" }}>{v}</strong> },
    { title: "Items", dataIndex: "itemCount", align: "right", width: 80, render: (v: number) => qty(v) },
    { title: "Total", dataIndex: "totalAmount", align: "right", render: (v: number) => <strong>{money(v)}</strong> },
    { title: "Payment", dataIndex: "isPaid", render: (v: boolean) => <PaidPill paid={v} /> },
    { title: "Status", dataIndex: "status", render: (v: CoStatus) => <StatusPill status={v} /> },
    { title: "Created", dataIndex: "createdAt", render: (v: string | null) => <span style={mutedText}>{dateTime(v)}</span> },
  ];

  return (
    <div style={pageWrap}>
      <BackButton href="/customers" />
      {error && (
        <Alert type="error" showIcon message={error} style={{ margin: "14px 0" }} action={<Button size="small" onClick={load}>Retry</Button>} />
      )}
      {loading && !customer ? (
        <Skeleton active style={{ marginTop: 20 }} />
      ) : customer ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", margin: "14px 0 20px" }}>
            <div>
              <h1 style={pageTitle}>{customer.title}</h1>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                <CustomerStatusPill status={customer.status} />
                <TierChip name={customer.tierName} color={customer.tierColor} />
                {customer.discountPercent > 0 && <span style={mutedText}>{customer.discountPercent}% loyalty discount</span>}
              </div>
            </div>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Refresh
            </Button>
          </div>

          {customer.status === "REJECTED" && customer.rejectionReason && (
            <Alert type="warning" showIcon message={`Rejected: ${customer.rejectionReason}`} style={{ marginBottom: 16 }} />
          )}

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <Stat label="Total orders" value={customer.orderCount} />
              <Stat label="Completed" value={customer.completedOrders} />
              <Stat label="Total spent" value={money(customer.totalSpent)} />
              <Stat label="Units bought" value={qty(customer.totalQuantity)} />
              <Stat label="Last order" value={<span style={{ fontSize: 16 }}>{dateTime(customer.lastOrderAt) || "—"}</span>} />
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
            <Card title="Contact">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Row label="Contact name">{customer.name ?? "—"}</Row>
                <Row label="Company">{customer.company ?? "—"}</Row>
                <Row label="Phone">
                  {customer.phone ? (
                    <>
                      <PhoneOutlined /> {customer.phone}
                    </>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Telegram">
                  {customer.telegramAccounts.length ? (
                    <>
                      <SendOutlined /> {customer.telegramAccounts.join(", ")}
                    </>
                  ) : (
                    (customer.telegram ?? "—")
                  )}
                </Row>
                <Row label="Address">
                  {customer.address ? (
                    <>
                      <EnvironmentOutlined /> {customer.address}
                    </>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Registered">{dateTime(customer.joinedAt) || "—"}</Row>
              </div>
            </Card>
          </div>

          <Card title={`Orders (${orders.length})`} style={{ padding: 16 }}>
            <Table<CustomerOrderSummary>
              rowKey="id"
              columns={columns}
              dataSource={orders}
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
              scroll={{ x: 640 }}
              onRow={(o) => ({ onClick: () => router.push(`/customer-orders/${o.id}`), style: { cursor: "pointer" } })}
              locale={{ emptyText: "This customer has not placed an order yet." }}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
