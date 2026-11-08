"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Image, Input, InputNumber, Modal, Skeleton, Table, Upload, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  PictureOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  errorText,
  fetchCustomerOrder,
  recordPayment,
  rejectOrder,
  runOrderAction,
  CoAction,
} from "@/features/customer-orders/customer-orders.api";
import { CoItem, CoStatus, CustomerOrderDetail } from "@/features/customer-orders/customer-orders.types";
import { Card, PaidPill, StatusPill, dateTime, money, mutedText, pageTitle, pageWrap, qty } from "./co-ui";

import { markSeen } from "@/features/seen/seen-store";
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STEPS: { label: string; reached: (o: CustomerOrderDetail) => boolean }[] = [
  { label: "Pending review", reached: () => true },
  { label: "Confirmed", reached: (o) => !["PENDING_REVIEW", "WAITING_CUSTOMER", "REJECTED", "CANCELLED"].includes(o.status) },
  { label: "Processing", reached: (o) => ["PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(o.status) },
  { label: "Out for delivery", reached: (o) => ["OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(o.status) },
  { label: "Delivered", reached: (o) => ["DELIVERED", "COMPLETED"].includes(o.status) },
  { label: "Paid", reached: (o) => o.isPaid },
  { label: "Completed", reached: (o) => o.status === "COMPLETED" },
];

function Stepper({ order }: { order: CustomerOrderDetail }) {
  const closed = order.status === "REJECTED" || order.status === "CANCELLED";
  return (
    <Card style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STEPS.map((s) => {
          const done = !closed && s.reached(order);
          return (
            <div key={s.label} style={{ flex: "1 1 90px", minWidth: 100, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 4, borderRadius: 4, background: done ? "var(--purple)" : "var(--card-border)" }} />
              <span style={{ fontSize: 12, fontWeight: done ? 700 : 600, color: done ? "var(--purple)" : "var(--muted)" }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function CustomerOrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, modalHolder] = Modal.useModal();
  const [msg, msgHolder] = message.useMessage();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | null>(null);
  const [payNote, setPayNote] = useState("");
  const [payFiles, setPayFiles] = useState<UploadFile[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await fetchCustomerOrder(orderId));
      markSeen("orders", [orderId]);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Runs one server action, then reloads the order. */
  async function run(fn: () => Promise<void>, done: string): Promise<boolean> {
    setBusy(true);
    try {
      await fn();
      msg.success(done);
      await load();
      return true;
    } catch (e) {
      msg.error(errorText(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const act = (action: CoAction, done: string) => run(() => runOrderAction(orderId, action), done);

  function confirmAccept() {
    modal.confirm({
      title: "Accept this order?",
      content: "Stock is taken from the warehouse right away and the customer is told by Telegram.",
      okText: "Accept order",
      onOk: () => act("accept", "Order accepted"),
    });
  }

  async function submitReject() {
    const reason = rejectReason.trim();
    if (!reason) return msg.warning("Please write a reason for the customer.");
    if (await run(() => rejectOrder(orderId, reason), "Order rejected")) {
      setRejectOpen(false);
      setRejectReason("");
    }
  }

  function openPay() {
    setPayAmount(order?.totalAmount ?? null);
    setPayNote("");
    setPayFiles([]);
    setPayOpen(true);
  }

  async function submitPay() {
    if (!payAmount || payAmount <= 0) return msg.warning("Enter the amount received.");
    const file = payFiles[0]?.originFileObj ?? null;
    const ok = await run(() => recordPayment(orderId, { amount: payAmount, remark: payNote.trim(), proof: file }), "Payment recorded");
    if (ok) setPayOpen(false);
  }

  if (loading && !order) {
    return (
      <div style={pageWrap}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }
  if (!order) {
    return (
      <div style={pageWrap}>
        <Link href="/customer-orders" style={{ color: "var(--purple)" }}>
          <ArrowLeftOutlined /> Back to customer orders
        </Link>
        <Alert style={{ marginTop: 16 }} type="error" showIcon message={error ?? "Order not found."} action={<Button size="small" onClick={load}>Retry</Button>} />
      </div>
    );
  }

  const s: CoStatus = order.status;
  const canDecide = s === "PENDING_REVIEW";
  const canProcess = s === "CONFIRMED";
  const canDeliver = s === "PROCESSING";
  const canMarkDelivered = s === "OUT_FOR_DELIVERY";
  const canMarkPaid = !order.isPaid && ["CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s);
  const canComplete = s === "DELIVERED" && order.isPaid;
  const hasActions = canDecide || canProcess || canDeliver || canMarkDelivered || canMarkPaid || canComplete;

  const columns: ColumnsType<CoItem> = [
    {
      title: "Product",
      render: (_, i) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>{i.name}</div>
          {i.variantName && <div style={{ fontSize: 12, color: "var(--muted)" }}>{i.variantName}</div>}
        </div>
      ),
    },
    { title: "Requested", dataIndex: "requested", align: "right", render: qty },
    {
      title: "Confirmed",
      align: "right",
      render: (_, i) => (
        <span style={{ fontWeight: 700, color: i.waiting > 0 ? "#D97706" : undefined }}>
          {qty(i.approved)}
          {i.waiting > 0 ? ` (+${qty(i.waiting)} waiting)` : ""}
        </span>
      ),
    },
    { title: "Unit price", dataIndex: "unitPrice", align: "right", render: money },
    { title: "Line total", dataIndex: "subtotal", align: "right", render: (v: number) => <strong>{money(v)}</strong> },
    { title: "Warehouse", dataIndex: "warehouseName", render: (v: string | null) => <span style={mutedText}>{v ?? "—"}</span> },
  ];

  return (
    <div style={pageWrap}>
      {modalHolder}
      {msgHolder}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <Link href="/customer-orders" style={{ fontSize: 13, color: "var(--muted)" }}>
            <ArrowLeftOutlined /> Customer orders
          </Link>
          <h1 style={{ ...pageTitle, marginTop: 6 }}>
            {order.orderNo} · {order.customer.title}
          </h1>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <StatusPill status={s} />
            <PaidPill paid={order.isPaid} />
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Stepper order={order} />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "2 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Items">
            <Table<CoItem> rowKey="id" columns={columns} dataSource={order.items} pagination={false} scroll={{ x: 640 }} size="middle" />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, marginTop: 14, fontSize: 13.5 }}>
              {order.discountAmount > 0 && (
                <>
                  <div style={{ display: "flex", gap: 28 }}>
                    <span style={mutedText}>Subtotal</span>
                    <span>{money(order.subtotalAmount)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 28 }}>
                    <span style={mutedText}>
                      {order.tierName ? `${order.tierName} discount` : "Discount"}
                      {order.discountPercent > 0 ? ` (${qty(order.discountPercent)}%)` : ""}
                    </span>
                    <span style={{ color: "#16A34A" }}>-{money(order.discountAmount)}</span>
                  </div>
                </>
              )}
              <div style={{ display: "flex", gap: 28, alignItems: "baseline" }}>
                <span style={mutedText}>Total</span>
                <strong style={{ fontSize: 18 }}>{money(order.totalAmount)}</strong>
              </div>
            </div>
          </Card>

          {(order.remark || order.staffNotes) && (
            <Card title="Notes">
              {order.remark && (
                <p style={{ margin: "0 0 8px", fontSize: 13.5 }}>
                  <span style={mutedText}>Customer: </span>
                  {order.remark}
                </p>
              )}
              {order.staffNotes && (
                <p style={{ margin: 0, fontSize: 13.5 }}>
                  <span style={mutedText}>Staff: </span>
                  {order.staffNotes}
                </p>
              )}
            </Card>
          )}

          {hasActions && (
            <Card title="Next action">
              <p style={{ ...mutedText, margin: "-6px 0 14px" }}>
                {canDecide
                  ? "Contact the customer if needed, then accept or reject the order."
                  : canMarkPaid && !canComplete
                    ? "The customer pays by contacting staff. Record the payment when it is received."
                    : "Move the order to its next step."}
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {canDecide && (
                  <>
                    <Button type="primary" icon={<CheckOutlined />} loading={busy} onClick={confirmAccept}>
                      Accept order
                    </Button>
                    <Button danger icon={<CloseOutlined />} disabled={busy} onClick={() => setRejectOpen(true)}>
                      Reject
                    </Button>
                  </>
                )}
                {canProcess && (
                  <Button type="primary" loading={busy} onClick={() => act("process", "Order is being prepared")}>
                    Start processing
                  </Button>
                )}
                {canDeliver && (
                  <Button type="primary" loading={busy} onClick={() => act("out-for-delivery", "Order is out for delivery")}>
                    Out for delivery
                  </Button>
                )}
                {canMarkDelivered && (
                  <Button type="primary" loading={busy} onClick={() => act("delivered", "Marked as delivered")}>
                    Mark as delivered
                  </Button>
                )}
                {canMarkPaid && (
                  <Button disabled={busy} onClick={openPay}>
                    Mark as paid
                  </Button>
                )}
                {canComplete && (
                  <Button type="primary" icon={<CheckOutlined />} loading={busy} onClick={() => act("complete", "Order completed")}>
                    Complete order
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Customer">
            <div style={{ fontWeight: 700, fontSize: 15 }}>{order.customer.title}</div>
            {order.customer.company && order.customer.company !== order.customer.title && (
              <div style={mutedText}>{order.customer.company}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
              {order.customer.phone && (
                <a href={`tel:${order.customer.phone}`} style={{ color: "inherit" }}>
                  <PhoneOutlined /> &nbsp;{order.customer.phone}
                </a>
              )}
              {order.customer.telegram && <span>Telegram {order.customer.telegram}</span>}
              {order.address && (
                <span>
                  <EnvironmentOutlined /> &nbsp;{order.address}
                </span>
              )}
            </div>
          </Card>

          <Card title="Payment">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={mutedText}>Status</span>
                <PaidPill paid={order.isPaid} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={mutedText}>Amount due</span>
                <strong>{money(order.totalAmount)}</strong>
              </div>
              {order.isPaid && order.paidAt && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={mutedText}>Paid</span>
                  <span>
                    {dateTime(order.paidAt)}
                    {order.paidByName ? ` · ${order.paidByName}` : ""}
                  </span>
                </div>
              )}
            </div>
            {order.proofImageUrl && (
              <div style={{ marginTop: 14 }}>
                <div style={{ ...mutedText, marginBottom: 6 }}>Payment proof</div>
                <Image src={order.proofImageUrl} alt="Payment proof" width={140} style={{ borderRadius: 12, objectFit: "cover" }} />
              </div>
            )}
          </Card>

          <Card title="Activity">
            {order.messages.length === 0 ? (
              <span style={mutedText}>No activity yet.</span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {order.messages.map((m, idx) => (
                  <div key={m.id} style={{ display: "flex", gap: 12 }}>
                    <span style={{ marginTop: 5, width: 10, height: 10, borderRadius: "50%", flex: "none", background: idx === order.messages.length - 1 ? "var(--purple)" : "var(--card-border)" }} />
                    <div style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{m.message}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {m.senderName ? `${m.senderName} · ` : ""}
                        {dateTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        title="Reject this order"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={submitReject}
        okText="Reject order"
        okButtonProps={{ danger: true, loading: busy }}
      >
        <p style={mutedText}>The customer receives this reason by Telegram.</p>
        <Input.TextArea rows={3} maxLength={300} showCount value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="For example: this item is no longer available" />
      </Modal>

      <Modal
        title="Mark as paid"
        open={payOpen}
        onCancel={() => setPayOpen(false)}
        onOk={submitPay}
        okText="Mark as paid"
        okButtonProps={{ loading: busy }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Amount received</div>
            <InputNumber prefix="$" min={0} precision={2} style={{ width: "100%" }} value={payAmount} onChange={(v) => setPayAmount(v)} />
          </label>
          <label>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Note (optional)</div>
            <Input maxLength={200} value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="For example: paid by ABA transfer" />
          </label>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Photo of the transaction (optional)</div>
            <Upload
              listType="picture"
              maxCount={1}
              accept=".jpg,.jpeg,.png,.webp"
              fileList={payFiles}
              beforeUpload={(file) => {
                if (!PROOF_TYPES.includes(file.type)) {
                  msg.error("Use a JPG, PNG or WEBP image.");
                  return Upload.LIST_IGNORE;
                }
                if (file.size > MAX_PROOF_BYTES) {
                  msg.error("The image is larger than 5 MB.");
                  return Upload.LIST_IGNORE;
                }
                return false; // keep it local; it is sent with the payment
              }}
              onChange={({ fileList }) => setPayFiles(fileList.slice(-1))}
            >
              {payFiles.length === 0 && (
                <Button icon={<PictureOutlined />}>Choose photo</Button>
              )}
            </Upload>
            <div style={{ ...mutedText, fontSize: 11.5, marginTop: 4 }}>JPG, PNG or WEBP, up to 5 MB.</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
