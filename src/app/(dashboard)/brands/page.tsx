"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Tag, message } from "antd";
import { PlusOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";
import { Table, Column } from "@/components/ui/table";
import {
  getBrands,
  createBrand,
  updateBrand,
} from "@/features/brands/brands.api";
import { Brand } from "@/features/brands/brands.types";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    setLoading(true);
    try {
      const data = await getBrands();
      setBrands(data);
    } catch {
      message.error("Failed to load brands.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingBrand(null);
    form.resetFields();
    setIsModalOpen(true);
  }

  function handleOpenEdit(brand: Brand) {
    setEditingBrand(brand);
    form.setFieldsValue({
      code: brand.code,
      name: brand.name,
      description: brand.description,
    });
    setIsModalOpen(true);
  }

  async function handleFinish(values: any) {
    setSubmitting(true);
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, {
          name: values.name,
          description: values.description,
        });
        message.success("Brand updated successfully.");
        setBrands((prev) =>
          prev.map((b) =>
            b.id === editingBrand.id
              ? { ...b, name: values.name, description: values.description }
              : b,
          ),
        );
      } else {
        const newBrand = await createBrand({
          code: values.code.toUpperCase(),
          name: values.name,
          description: values.description,
        });
        message.success("Brand created successfully.");
        if (newBrand && newBrand.id) {
          setBrands((prev) => [newBrand, ...prev]);
        } else {
          setBrands((prev) => [
            {
              id: Date.now().toString(),
              code: values.code.toUpperCase(),
              name: values.name,
              description: values.description,
            },
            ...prev,
          ]);
        }
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err?.message || "Failed to save brand.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredBrands = brands.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.code?.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Brand>[] = [
    {
      key: "code",
      header: "Brand Code",
      width: 180,
      render: (brand) => (
        <Tag
          color="blue"
          style={{
            fontWeight: 700,
            fontSize: 12.5,
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          {brand.code}
        </Tag>
      ),
    },
    {
      key: "name",
      header: "Brand Name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (brand) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
            {brand.name}
          </div>
          {brand.description && (
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              {brand.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: 120,
      render: (brand) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(brand)}
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
            Brands
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Manage brand manufacturers, authorized partners, and brand codes.
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
          Add Brand
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
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </div>

        <Table
          columns={columns}
          data={filteredBrands}
          loading={loading}
          emptyText="No brands found."
        />
      </div>

      <Modal
        title={editingBrand ? "Edit Brand" : "Create New Brand"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Brand Code"
            name="code"
            rules={[
              { required: true, message: "Please enter brand code" },
              {
                pattern: /^[A-Za-z0-9_]+$/,
                message: "Alphanumeric characters only",
              },
            ]}
          >
            <Input
              placeholder="e.g. APPLE or SAMSUNG"
              disabled={!!editingBrand}
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item
            label="Brand Name"
            name="name"
            rules={[{ required: true, message: "Please enter brand name" }]}
          >
            <Input placeholder="e.g. Apple Inc." />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Brief description of brand" />
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
              {editingBrand ? "Save Changes" : "Create Brand"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
