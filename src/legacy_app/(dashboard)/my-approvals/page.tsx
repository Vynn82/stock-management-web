"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Badge,
  Card,
  Row,
  Col,
  Descriptions,
  Radio,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  AuditOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Table, Column } from "@/components/ui/table";
import { getRequests, commitRequest } from "@/features/requests/requests.api";
import { InventoryRequest } from "@/features/requests/requests.types";

export default function MyApprovalsPage() {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  // Review / Commit Modal
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<InventoryRequest | null>(null);
  const [commitForm] = Form.useForm();
  const [committing, setCommitting] = useState(false);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await getRequests();
      setRequests(data);
    } catch {
      message.error("Failed to load approval requests.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCommit(req: InventoryRequest) {
    setSelectedRequest(req);
    commitForm.resetFields();
    commitForm.setFieldsValue({
      action: "APPROVE",
      remark: "Everything is verified and approved.",
    });
    setIsCommitModalOpen(true);
  }

  async function handleCommitFinish(values: any) {
    if (!selectedRequest) return;
    setCommitting(true);
    try {
      await commitRequest(selectedRequest.id, {
        action: values.action,
        remark: values.remark,
      });

      const isApprove = values.action === "APPROVE";
      message.success(
        `Request ${isApprove ? "approved" : "rejected"} successfully.`,
      );

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: isApprove ? "APPROVED" : "REJECTED",
                remark: values.remark,
                approvers: (r.approvers || []).map((app) => ({
                  ...app,
                  status: isApprove ? "APPROVED" : "REJECTED",
                })),
              }
            : r,
        ),
      );

      setIsCommitModalOpen(false);
    } catch (err: any) {
      message.error(err?.message || "Failed to commit approval decision.");
    } finally {
      setCommitting(false);
    }
  }

  function getStatusTag(status: string) {
    switch (status) {
      case "APPROVED":
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            Approved
          </Tag>
        );
      case "REJECTED":
        return (
          <Tag
            icon={<CloseCircleOutlined />}
            color="error"
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            Rejected
          </Tag>
        );
      case "COMMITTED":
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="purple"
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            Committed
          </Tag>
        );
      default:
        return (
          <Tag
            icon={<ClockCircleOutlined />}
            color="processing"
            style={{ borderRadius: 6, fontWeight: 600, padding: "2px 8px" }}
          >
            Pending Review
          </Tag>
        );
    }
  }

  const filteredRequests = requests.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      (r.product?.productName || "").toLowerCase().includes(q) ||
      (r.product?.productCode || "").toLowerCase().includes(q) ||
      (r.product?.productSku || "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" || r.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter(
    (r) => r.status === "APPROVED" || r.status === "COMMITTED",
  ).length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const columns: Column<InventoryRequest>[] = [
    {
      key: "id",
      header: "Request ID",
      width: 140,
      render: (r) => (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "var(--brand-600)",
            fontWeight: 600,
          }}
        >
          {r.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "product",
      header: "Product Intake Item",
      render: (r) => (
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "var(--text-main)",
            }}
          >
            {r.product?.productName || "Product Intake"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            Code: {r.product?.productCode || "N/A"} • SKU:{" "}
            {r.product?.productSku || "N/A"}
          </div>
          <div style={{ marginTop: 4 }}>
            {r.product?.categoryCode && (
              <Tag style={{ fontSize: 11, borderRadius: 4 }}>
                {r.product.categoryCode}
              </Tag>
            )}
            {r.product?.brandCode && (
              <Tag style={{ fontSize: 11, borderRadius: 4 }}>
                {r.product.brandCode}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "variants",
      header: "Variants & Units",
      width: 170,
      render: (r) => {
        const variantCount = r.variants?.length || 0;
        const totalStock = (r.stock || []).reduce(
          (acc, s) => acc + (Number(s.quantity) || 0),
          0,
        );
        return (
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-main)",
              }}
            >
              {variantCount} variant{variantCount !== 1 ? "s" : ""}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              Total Intake: <strong>{totalStock} units</strong>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: 140,
      render: (r) => getStatusTag(r.status),
    },
    {
      key: "approvers",
      header: "Signoff Progress",
      render: (r) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {r.approvers && r.approvers.length > 0 ? (
            r.approvers.map((app, i) => (
              <span key={i} style={{ fontSize: 11.5 }}>
                <Badge
                  status={app.status === "APPROVED" ? "success" : "processing"}
                  text={`${app.actionType}: ${app.status || "PENDING"}`}
                />
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Standard Intake
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: 150,
      render: (r) => (
        <Space>
          {r.status === "PENDING" ? (
            <Button
              type="primary"
              size="small"
              onClick={() => handleOpenCommit(r)}
              style={{
                backgroundColor: "var(--brand-600)",
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Review / Sign Off
            </Button>
          ) : (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRequest(r);
                setIsDetailModalOpen(true);
              }}
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              Details
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <AuditOutlined style={{ color: "var(--brand-600)" }} /> My Approvals
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Review, sign off, or reject product intake and stock requests
            awaiting your authorization.
          </p>
        </div>

        <Button
          onClick={loadRequests}
          loading={loading}
          style={{ height: 40, borderRadius: 10, fontWeight: 500 }}
        >
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Awaiting My Sign Off
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: "#f59e0b",
              }}
            >
              {pendingCount}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Approved
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: "#10b981",
              }}
            >
              {approvedCount}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Rejected
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: "#ef4444",
              }}
            >
              {rejectedCount}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Total Evaluated
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 4,
                color: "var(--text-main)",
              }}
            >
              {totalCount}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--card-shadow)",
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search pending reviews by product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 340, borderRadius: 8 }}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 170 }}
            options={[
              { label: "Pending Review", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
              { label: "All Requests", value: "ALL" },
            ]}
          />
        </div>

        <Table
          columns={columns}
          data={filteredRequests}
          loading={loading}
          emptyText="No requests matching current filter."
        />
      </div>

      {/* Review & Commit Modal */}
      <Modal
        title={`Review Request: ${selectedRequest?.product?.productName || "Product Intake"}`}
        open={isCommitModalOpen}
        onCancel={() => setIsCommitModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <div style={{ marginTop: 16 }}>
            {/* Quick summary box */}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                backgroundColor: "rgba(124, 58, 237, 0.05)",
                border: "1px solid rgba(124, 58, 237, 0.15)",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--text-main)",
                }}
              >
                {selectedRequest.product?.productName}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                SKU:{" "}
                {selectedRequest.product?.productSku ||
                  selectedRequest.product?.productCode}{" "}
                • Category: {selectedRequest.product?.categoryCode} • Brand:{" "}
                {selectedRequest.product?.brandCode}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Total Intake Quantity:{" "}
                <strong>
                  {(selectedRequest.stock || []).reduce(
                    (acc, s) => acc + (Number(s.quantity) || 0),
                    0,
                  )}{" "}
                  units
                </strong>{" "}
                across {selectedRequest.variants?.length || 0} variant(s).
              </div>
            </div>

            <Form
              form={commitForm}
              layout="vertical"
              onFinish={handleCommitFinish}
            >
              <Form.Item
                name="action"
                label="Signoff Decision"
                rules={[{ required: true, message: "Please select an action" }]}
              >
                <Radio.Group style={{ display: "flex", gap: 16 }}>
                  <Radio.Button
                    value="APPROVE"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      height: 42,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      borderRadius: 8,
                      borderColor: "#10b981",
                      color: "#10b981",
                    }}
                  >
                    <CheckOutlined style={{ marginRight: 6 }} /> Approve Request
                  </Radio.Button>
                  <Radio.Button
                    value="REJECT"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      height: 42,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      borderRadius: 8,
                      borderColor: "#ef4444",
                      color: "#ef4444",
                    }}
                  >
                    <CloseOutlined style={{ marginRight: 6 }} /> Reject Request
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="remark"
                label="Decision Remark / Feedback"
                rules={[
                  {
                    required: true,
                    message: "Please enter a remark or reason",
                  },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="e.g. Verified packaging, quality assurance passed, ready for warehouse intake."
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 24,
                }}
              >
                <Button
                  onClick={() => setIsCommitModalOpen(false)}
                  style={{ borderRadius: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={committing}
                  style={{
                    backgroundColor: "var(--brand-600)",
                    borderRadius: 8,
                    fontWeight: 600,
                    padding: "0 20px",
                  }}
                >
                  Submit Decision
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title={`Request Details: ${selectedRequest?.product?.productName || selectedRequest?.id}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsDetailModalOpen(false)}
            style={{ borderRadius: 8 }}
          >
            Close
          </Button>,
        ]}
        width={680}
      >
        {selectedRequest && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Request ID" span={2}>
                <span
                  style={{ fontFamily: "monospace", color: "var(--brand-600)" }}
                >
                  {selectedRequest.id}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Product Name">
                <strong>{selectedRequest.product?.productName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Product Code">
                {selectedRequest.product?.productCode}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                {selectedRequest.product?.categoryCode || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Brand">
                {selectedRequest.product?.brandCode || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedRequest.status)}
              </Descriptions.Item>
              {selectedRequest.remark && (
                <Descriptions.Item label="Remark / Decision Note" span={2}>
                  <em>“{selectedRequest.remark}”</em>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Variants table */}
            {selectedRequest.variants &&
              selectedRequest.variants.length > 0 && (
                <div>
                  <h4
                    style={{
                      margin: "10px 0 6px",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Variants ({selectedRequest.variants.length})
                  </h4>
                  <div
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        fontSize: 12.5,
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "rgba(0,0,0,0.02)",
                            textAlign: "left",
                          }}
                        >
                          <th style={{ padding: "8px 12px" }}>Code</th>
                          <th style={{ padding: "8px 12px" }}>Name</th>
                          <th style={{ padding: "8px 12px" }}>Cost Price</th>
                          <th style={{ padding: "8px 12px" }}>Selling Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequest.variants.map((v, i) => (
                          <tr
                            key={i}
                            style={{
                              borderTop: "1px solid var(--border-color)",
                            }}
                          >
                            <td
                              style={{
                                padding: "8px 12px",
                                fontFamily: "monospace",
                              }}
                            >
                              {v.variantCode}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              {v.variantName}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              ${v.variantCostPrice || 0}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              ${v.variantSellingPrice || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
