"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Tag, message } from "antd";
import { PlusOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";
import { Table, Column } from "@/components/ui/table";
import {
  getCategories,
  createCategory,
  updateCategory,
} from "@/features/categories/categories.api";
import { Category } from "@/features/categories/categories.types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      message.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat: Category) {
    setEditingCategory(cat);
    form.setFieldsValue({
      code: cat.code,
      name: cat.name,
      description: cat.description,
    });
    setIsModalOpen(true);
  }

  async function handleFinish(values: any) {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: values.name,
          description: values.description,
        });
        message.success("Category updated successfully.");
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? { ...c, name: values.name, description: values.description }
              : c,
          ),
        );
      } else {
        const newCat = await createCategory({
          code: values.code.toUpperCase(),
          name: values.name,
          description: values.description,
        });
        message.success("Category created successfully.");
        if (newCat && newCat.id) {
          setCategories((prev) => [newCat, ...prev]);
        } else {
          setCategories((prev) => [
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
      message.error(err?.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCategories = categories.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Category>[] = [
    {
      key: "code",
      header: "Category Code",
      width: 180,
      render: (cat) => (
        <Tag
          color="purple"
          style={{
            fontWeight: 700,
            fontSize: 12.5,
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          {cat.code}
        </Tag>
      ),
    },
    {
      key: "name",
      header: "Category Name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (cat) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
            {cat.name}
          </div>
          {cat.description && (
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              {cat.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: 120,
      render: (cat) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(cat)}
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
            Categories
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Manage item classification and taxonomies for products and stock.
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
          Add Category
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
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </div>

        <Table
          columns={columns}
          data={filteredCategories}
          loading={loading}
          emptyText="No categories found."
        />
      </div>

      <Modal
        title={editingCategory ? "Edit Category" : "Create New Category"}
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
            label="Category Code"
            name="code"
            rules={[
              { required: true, message: "Please enter category code" },
              {
                pattern: /^[A-Za-z0-9_]+$/,
                message: "Alphanumeric characters only",
              },
            ]}
          >
            <Input
              placeholder="e.g. SMARTPHONE"
              disabled={!!editingCategory}
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input placeholder="e.g. Smartphone" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Brief description of category"
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
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
