"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Tag,
  message,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  PhoneOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Table, Column } from "@/components/ui/table";
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
} from "@/features/warehouses/warehouses.api";
import { Warehouse } from "@/features/warehouses/warehouses.types";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  async function loadWarehouses() {
    setLoading(true);
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch {
      message.error("Failed to load warehouses.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingWarehouse(null);
    form.resetFields();
    setIsModalOpen(true);
  }

  function handleOpenEdit(wh: Warehouse) {
    setEditingWarehouse(wh);
    form.setFieldsValue({
      code: wh.code,
      name: wh.name,
      description: wh.description,
      address: wh.address,
      latitude: wh.latitude,
      longitude: wh.longitude,
      contactPerson: wh.contactPerson,
      phone: wh.phone,
    });
    setIsModalOpen(true);
  }

  async function handleFinish(values: any) {
    setSubmitting(true);
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, {
          name: values.name,
          description: values.description,
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
          contactPerson: values.contactPerson,
          phone: values.phone,
        });
        message.success("Warehouse updated successfully.");
        setWarehouses((prev) =>
          prev.map((w) =>
            w.id === editingWarehouse.id
              ? {
                  ...w,
                  name: values.name,
                  description: values.description,
                  address: values.address,
                  latitude: values.latitude,
                  longitude: values.longitude,
                  contactPerson: values.contactPerson,
                  phone: values.phone,
                }
              : w,
          ),
        );
      } else {
        const newWh = await createWarehouse({
          code: values.code.toUpperCase(),
          name: values.name,
          description: values.description,
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
          contactPerson: values.contactPerson,
          phone: values.phone,
        });
        message.success("Warehouse created successfully.");
        if (newWh && newWh.id) {
          setWarehouses((prev) => [newWh, ...prev]);
        } else {
          setWarehouses((prev) => [
            {
              id: Date.now().toString(),
              code: values.code.toUpperCase(),
              name: values.name,
              description: values.description,
              address: values.address,
              latitude: values.latitude,
              longitude: values.longitude,
              contactPerson: values.contactPerson,
              phone: values.phone,
            },
            ...prev,
          ]);
        }
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err?.message || "Failed to save warehouse.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.code?.toLowerCase().includes(search.toLowerCase()) ||
      w.address?.toLowerCase().includes(search.toLowerCase()) ||
      w.contactPerson?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Warehouse>[] = [
    {
      key: "code",
      header: "Warehouse Code",
      width: 150,
      render: (wh) => (
        <Tag
          color="cyan"
          style={{
            fontWeight: 700,
            fontSize: 12.5,
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          {wh.code}
        </Tag>
      ),
    },
    {
      key: "name",
      header: "Warehouse Name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (wh) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
            {wh.name}
          </div>
          {wh.description && (
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              {wh.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "address",
      header: "Location & Address",
      render: (wh) => (
        <div>
          <div style={{ fontSize: 13, color: "var(--text-main)" }}>
            <EnvironmentOutlined
              style={{ marginRight: 6, color: "var(--brand-600)" }}
            />
            {wh.address || "—"}
          </div>
          {wh.latitude !== undefined && wh.longitude !== undefined && (
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
            >
              Coordinates: {Number(wh.latitude).toFixed(4)},{" "}
              {Number(wh.longitude).toFixed(4)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact Person",
      render: (wh) => (
        <div>
          <div
            style={{ fontWeight: 500, fontSize: 13, color: "var(--text-main)" }}
          >
            <UserOutlined style={{ marginRight: 6, color: "#8c8c8c" }} />
            {wh.contactPerson || "—"}
          </div>
          {wh.phone && (
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              <PhoneOutlined style={{ marginRight: 6, color: "#8c8c8c" }} />
              {wh.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: 100,
      render: (wh) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(wh)}
          style={{ padding: 0, fontWeight: 600 }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            Warehouses
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Manage inventory facilities, locations, coordinates, and contact
            supervisors.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
          style={{
            backgroundColor: "var(--brand-600)",
            height: 42,
            borderRadius: 10,
            padding: "0 20px",
            fontWeight: 600,
          }}
        >
          Add Warehouse
        </Button>
      </div>

      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--card-shadow)",
          padding: 20,
        }}
      >
        <div style={{ marginBottom: 16, maxWidth: 360 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search warehouses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </div>

        <Table
          columns={columns}
          data={filteredWarehouses}
          loading={loading}
          emptyText="No warehouses found."
        />
      </div>

      <Modal
        title={editingWarehouse ? "Edit Warehouse" : "Create New Warehouse"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Warehouse Code"
                name="code"
                rules={[
                  { required: true, message: "Please enter warehouse code" },
                  {
                    pattern: /^[A-Za-z0-9_]+$/,
                    message: "Alphanumeric characters only",
                  },
                ]}
              >
                <Input
                  placeholder="e.g. WH001"
                  disabled={!!editingWarehouse}
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Warehouse Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter warehouse name" },
                ]}
              >
                <Input placeholder="e.g. Phnom Penh Central Warehouse" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Address" name="address">
            <Input placeholder="e.g. Phnom Penh, Cambodia" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Latitude" name="latitude">
                <InputNumber
                  style={{ width: "100%" }}
                  step={0.0001}
                  placeholder="e.g. 11.5564"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Longitude" name="longitude">
                <InputNumber
                  style={{ width: "100%" }}
                  step={0.0001}
                  placeholder="e.g. 104.9282"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Contact Person" name="contactPerson">
                <Input placeholder="e.g. John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone Number" name="phone">
                <Input placeholder="e.g. 012345678" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={2}
              placeholder="Brief description of warehouse facility"
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ backgroundColor: "var(--brand-600)" }}
            >
              {editingWarehouse ? "Save Changes" : "Create Warehouse"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
