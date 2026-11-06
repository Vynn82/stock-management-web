"use client";

import { useState } from "react";
import { Collapse, message } from "antd";
import { CopyOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

const FAQ = [
  { q: "How do I approve or reject a request?", a: "Open Requests, click a pending item to see its detail, then use Approve or Reject. Rejecting requires a short reason." },
  { q: "How do I move stock between warehouses?", a: "Create a New Request of type Transfer. Pick the product, quantity and the From/To warehouses — it is submitted as a pending request like Stock In/Out." },
  { q: "How do I correct a stock count?", a: "Use Adjust stock on a product (or a New Request of type Adjustment) to increase or decrease its on-hand quantity, with a reason such as damaged, lost, or recount." },
  { q: "Who can manage categories, suppliers, and warehouses?", a: "Anyone with the matching permission under Manage. Admins and Managers typically handle this — see Team Members and Roles for who can do what." },
  { q: "How do I reset my password?", a: "From the login screen choose Forgot password and follow the steps to verify your account and set a new one. When signed in, use Settings → Security to change it." },
];

const CONTACTS = [
  { label: "Email support", value: "support@stockflow.com", icon: <MailOutlined /> },
  { label: "Call support", value: "+855 12 345 678", icon: <PhoneOutlined /> },
];

export default function HelpSupportPage() {
  const [messageApi, holder] = message.useMessage();
  const [open, setOpen] = useState<string[]>([]);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      messageApi.success(`${label} copied.`);
    } catch {
      messageApi.info(value);
    }
  };

  return (
    <div className="page-content data-page">
      {holder}
      <div style={{ maxWidth: 760 }}>
      <div className="page-heading" style={{ marginBottom: 20 }}>
        <h1>Help &amp; Support</h1>
        <p>Answers to common questions, and how to reach us.</p>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Frequently asked questions</h2>
      <Collapse
        activeKey={open}
        onChange={(k) => setOpen(Array.isArray(k) ? k : [k])}
        items={FAQ.map((f, i) => ({ key: String(i), label: <strong>{f.q}</strong>, children: <p style={{ margin: 0 }}>{f.a}</p> }))}
        style={{ marginBottom: 24, background: "var(--card, #fff)", borderRadius: 14 }}
      />

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Contact us</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {CONTACTS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => copy(c.label, c.value)}
            style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", background: "var(--card, #fff)", border: "1px solid #ECE9F3", borderRadius: 14, padding: "12px 16px", cursor: "pointer" }}
          >
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#F5F3FF", color: "#6D28D9", display: "grid", placeItems: "center" }}>{c.icon}</span>
            <span style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: 13.5 }}>{c.label}</strong>
              <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{c.value}</span>
            </span>
            <CopyOutlined style={{ color: "var(--muted)" }} />
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
