"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, InputNumber, Modal, Progress, Select, Switch, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  CountLine,
  WarehouseOption,
  applyDifference,
  fetchCountLines,
  fetchWarehouseOptions,
} from "@/features/stock/reconcile.api";
import { errorText } from "@/features/customer-orders/customer-orders.api";
import { Card, Pill, mutedText, pageTitle, pageWrap } from "@/components/customer-orders/co-ui";
import BackButton from "@/components/ui/BackButton";

export default function ReconcilePage() {
  const [msg, msgHolder] = message.useMessage();
  const [modal, modalHolder] = Modal.useModal();
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouse, setWarehouse] = useState<string | undefined>();
  const [lines, setLines] = useState<CountLine[]>([]);
  const [counted, setCounted] = useState<Record<string, number | null>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    fetchWarehouseOptions()
      .then((w) => {
        setWarehouses(w);
        if (w.length === 1) setWarehouse(w[0].code);
      })
      .catch((e) => setError(errorText(e)));
  }, []);

  async function load() {
    if (!warehouse) return msg.warning("Choose a warehouse first.");
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCountLines(warehouse);
      setLines(rows);
      // Start with the counted quantity equal to the system quantity: staff
      // only change the rows that differ on the shelf.
      setCounted(Object.fromEntries(rows.map((r) => [r.key, r.systemQty])));
      setReasons({});
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  const diffOf = (l: CountLine) => {
    const c = counted[l.key];
    return c == null ? 0 : c - l.systemQty;
  };

  const stats = useMemo(() => {
    let match = 0;
    let diffs = 0;
    let short = 0;
    let extra = 0;
    for (const l of lines) {
      const d = diffOf(l);
      if (d === 0) match++;
      else {
        diffs++;
        if (d < 0) short += -d;
        else extra += d;
      }
    }
    return { total: lines.length, match, diffs, short, extra, net: extra - short };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, counted]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lines.filter((l) => {
      if (onlyDiff && diffOf(l) === 0) return false;
      return !q || `${l.name} ${l.sku}`.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, counted, search, onlyDiff]);

  function submit() {
    const changed = lines.filter((l) => diffOf(l) !== 0);
    if (changed.length === 0) return msg.info("Nothing to change. Every counted quantity matches the system.");
    modal.confirm({
      title: `Apply ${changed.length} adjustment${changed.length === 1 ? "" : "s"}?`,
      content: `Stock in ${warehouses.find((w) => w.code === warehouse)?.name ?? warehouse} will be changed to the counted quantities. This needs the stock adjust permission and is recorded in the stock history.`,
      okText: "Apply adjustments",
      onOk: async () => {
        const failed: string[] = [];
        for (let i = 0; i < changed.length; i++) {
          const l = changed[i];
          setProgress(Math.round((i / changed.length) * 100));
          try {
            const reason = (reasons[l.key] ?? "").trim() || `Reconciliation ${dayjs().format("DD/MM/YYYY")}`;
            await applyDifference(l, warehouse!, diffOf(l), reason);
          } catch (e) {
            failed.push(`${l.name}: ${errorText(e)}`);
          }
        }
        setProgress(null);
        if (failed.length === 0) msg.success(`${changed.length} adjustments applied.`);
        else
          modal.error({
            title: `${changed.length - failed.length} applied, ${failed.length} failed`,
            content: (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {failed.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ),
          });
        await load();
      },
    });
  }

  const columns: ColumnsType<CountLine> = [
    {
      title: "Product",
      render: (_, l) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>{l.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{l.sku}</div>
        </div>
      ),
    },
    { title: "System", dataIndex: "systemQty", align: "right", width: 100 },
    {
      title: "Counted",
      align: "right",
      width: 140,
      render: (_, l) => (
        <InputNumber
          min={0}
          precision={0}
          value={counted[l.key]}
          status={diffOf(l) !== 0 ? "warning" : undefined}
          style={{ width: 110 }}
          onChange={(v) => setCounted((c) => ({ ...c, [l.key]: v }))}
        />
      ),
    },
    {
      title: "Difference",
      align: "right",
      width: 110,
      render: (_, l) => {
        const d = diffOf(l);
        const color = d === 0 ? "#16A34A" : d > 0 ? "#D97706" : "#DC2626";
        return <strong style={{ color }}>{d > 0 ? `+${d}` : d}</strong>;
      },
    },
    { title: "Result", width: 110, render: (_, l) => (diffOf(l) === 0 ? <Pill tone="ok">Match</Pill> : <Pill tone="warn">Adjust</Pill>) },
    {
      title: "Reason",
      width: 220,
      render: (_, l) =>
        diffOf(l) === 0 ? (
          <span style={mutedText}>No change</span>
        ) : (
          <Input
            placeholder="Reconciliation"
            maxLength={120}
            value={reasons[l.key] ?? ""}
            onChange={(e) => setReasons((r) => ({ ...r, [l.key]: e.target.value }))}
          />
        ),
    },
  ];

  const kpis: { label: string; value: string; sub: string; color?: string }[] = [
    { label: "Items counted", value: String(stats.total), sub: warehouses.find((w) => w.code === warehouse)?.name ?? "No warehouse" },
    { label: "Matching", value: String(stats.match), sub: stats.total ? `${Math.round((stats.match / stats.total) * 100)}% match` : "—", color: "#16A34A" },
    { label: "Differences", value: String(stats.diffs), sub: "Need an adjustment", color: stats.diffs ? "#D97706" : undefined },
    { label: "Net units", value: stats.net > 0 ? `+${stats.net}` : String(stats.net), sub: `-${stats.short} short, +${stats.extra} extra`, color: stats.net < 0 ? "#DC2626" : undefined },
  ];

  return (
    <div style={pageWrap}>
      {msgHolder}
      {modalHolder}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <BackButton href="/stock" />
          <h1 style={pageTitle}>Reconcile stock</h1>
          <p style={{ ...mutedText, margin: "4px 0 0" }}>Compare what is counted on the shelf with what the system says.</p>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ flex: "1 1 260px", maxWidth: 360 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Warehouse</div>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              placeholder="Choose a warehouse"
              value={warehouse}
              onChange={setWarehouse}
              options={warehouses.map((w) => ({ value: w.code, label: w.name }))}
            />
          </label>
          <Button type="primary" icon={<ReloadOutlined />} onClick={load} loading={loading}>
            {lines.length ? "Reload from system" : "Load products"}
          </Button>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        {kpis.map((k) => (
          <Card key={k.label} style={{ flex: "1 1 200px", padding: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginTop: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: k.color ?? "var(--muted)" }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <Card
        title="Count sheet"
        extra={<span style={mutedText}>Change the counted quantity. Only rows with a difference become adjustments.</span>}
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search product or SKU" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <Switch size="small" checked={onlyDiff} onChange={setOnlyDiff} /> Only differences
          </label>
        </div>
        <Table<CountLine>
          rowKey="key"
          columns={columns}
          dataSource={visible}
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false, hideOnSinglePage: true }}
          scroll={{ x: 760 }}
          locale={{ emptyText: lines.length === 0 ? "Choose a warehouse and load its products." : "No rows match." }}
        />
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <p style={{ ...mutedText, margin: 0, maxWidth: 640 }}>
            Applies one stock adjustment for each of the {stats.diffs} rows with a difference. Needs the stock adjust permission; every change is saved in the stock history.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {progress !== null && <Progress type="circle" size={36} percent={progress} />}
            <Button type="primary" disabled={stats.diffs === 0 || progress !== null} onClick={submit}>
              {`Apply ${stats.diffs} adjustment${stats.diffs === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
