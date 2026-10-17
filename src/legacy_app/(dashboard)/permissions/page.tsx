"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Tag,
  Space,
  message,
  Tabs,
  Select,
} from "antd";
import {
  PlusOutlined,
  AppstoreAddOutlined,
  SearchOutlined,
  FolderAddOutlined,
} from "@ant-design/icons";
import { Table, Column } from "@/components/ui/table";
import { PermissionMatrix } from "@/features/permissions/components/permission-matrix";
import {
  getPermissions,
  addPermission,
  addPermissionsBulk,
  addPermissionResource,
} from "@/features/permissions/permissions.api";
import { Permission } from "@/features/permissions/permissions.types";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  const [addForm] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [resourceForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    setLoading(true);
    try {
      const data = await getPermissions();
      setPermissions(data);
    } catch {
      message.error("Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPermission(values: any) {
    setSubmitting(true);
    try {
      const res = await addPermission({
        resource: values.resource.toLowerCase(),
        action: values.action.toLowerCase(),
      });
      message.success("Permission added successfully.");
      setIsAddModalOpen(false);
      addForm.resetFields();

      const newPerm: Permission = {
        id: (res as any)?.id || Date.now().toString(),
        name: `${values.resource.toLowerCase()}:${values.action.toLowerCase()}`,
        category: values.resource.toLowerCase(),
        description:
          values.description || `Allow ${values.action} on ${values.resource}`,
      };
      setPermissions((prev) => [newPerm, ...prev]);
    } catch (err: any) {
      message.error(err?.message || "Failed to add permission.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkAdd(values: any) {
    setSubmitting(true);
    try {
      const actions: string[] = values.actions;
      const resource = values.resource.toLowerCase();
      const payload = actions.map((act) => ({ resource, action: act }));

      await addPermissionsBulk(payload);
      message.success(`Added ${actions.length} permissions in bulk.`);
      setIsBulkModalOpen(false);
      bulkForm.resetFields();

      const newPerms: Permission[] = actions.map((act, idx) => ({
        id: (Date.now() + idx).toString(),
        name: `${resource}:${act}`,
        category: resource,
        description: `Allow ${act} on ${resource}`,
      }));
      setPermissions((prev) => [...newPerms, ...prev]);
    } catch (err: any) {
      message.error(err?.message || "Failed to bulk add permissions.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddResource(values: any) {
    setSubmitting(true);
    try {
      await addPermissionResource(values.resource.toLowerCase());
      message.success("Permission resource registered.");
      setIsResourceModalOpen(false);
      resourceForm.resetFields();
    } catch (err: any) {
      message.error(err?.message || "Failed to register resource.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredPermissions = permissions.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Permission>[] = [
    {
      key: "name",
      header: "Permission Code",
      width: 200,
      render: (p) => (
        <code
          style={{
            fontWeight: 700,
            fontSize: 12.5,
            color: "var(--brand-600)",
            background: "rgba(124, 58, 237, 0.08)",
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          {p.name}
        </code>
      ),
    },
    {
      key: "category",
      header: "Resource Category",
      width: 160,
      render: (p) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 600 }}>
          {p.category || "General"}
        </Tag>
      ),
    },
    {
      key: "description",
      header: "Description / Access Scope",
      render: (p) => (
        <span style={{ color: "var(--text-main)", fontSize: 13 }}>
          {p.description || "—"}
        </span>
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
            System Permissions
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Granular capabilities, resources, and action boundaries defined for
            roles.
          </p>
        </div>
        <Space>
          <Button
            icon={<FolderAddOutlined />}
            onClick={() => setIsResourceModalOpen(true)}
            style={{ height: 42, borderRadius: 10, fontWeight: 600 }}
          >
            Register Resource
          </Button>
          <Button
            icon={<AppstoreAddOutlined />}
            onClick={() => setIsBulkModalOpen(true)}
            style={{ height: 42, borderRadius: 10, fontWeight: 600 }}
          >
            Bulk Add
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: "var(--brand-600)",
              height: 42,
              borderRadius: 10,
              padding: "0 20px",
              fontWeight: 600,
            }}
          >
            Add Permission
          </Button>
        </Space>
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
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </div>

        <Tabs
          defaultActiveKey="table"
          items={[
            {
              key: "table",
              label: "Permissions Table",
              children: (
                <Table
                  columns={columns}
                  data={filteredPermissions}
                  loading={loading}
                  emptyText="No permissions registered."
                />
              ),
            },
            {
              key: "matrix",
              label: "Category Matrix",
              children: <PermissionMatrix permissions={filteredPermissions} />,
            },
          ]}
        />
      </div>

      {/* Add Single Permission Modal */}
      <Modal
        title="Add System Permission"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddPermission}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Resource Target"
            name="resource"
            rules={[{ required: true, message: "Please specify resource" }]}
          >
            <Input placeholder="e.g. product, menu, warehouse" />
          </Form.Item>

          <Form.Item
            label="Action"
            name="action"
            rules={[{ required: true, message: "Please specify action" }]}
          >
            <Input placeholder="e.g. certify, view, create, update, delete" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Explain what this allows" />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ backgroundColor: "var(--brand-600)" }}
            >
              Add Permission
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Bulk Add Permissions Modal */}
      <Modal
        title="Bulk Add Resource Permissions"
        open={isBulkModalOpen}
        onCancel={() => setIsBulkModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkAdd}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Target Resource"
            name="resource"
            rules={[{ required: true, message: "Please enter resource name" }]}
          >
            <Input placeholder="e.g. product" />
          </Form.Item>

          <Form.Item
            label="Select Standard Actions"
            name="actions"
            rules={[
              { required: true, message: "Please select at least one action" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select actions to generate"
              options={[
                { label: "view", value: "view" },
                { label: "create", value: "create" },
                { label: "update", value: "update" },
                { label: "delete", value: "delete" },
                { label: "certify", value: "certify" },
                { label: "approve", value: "approve" },
              ]}
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
            <Button onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ backgroundColor: "var(--brand-600)" }}
            >
              Create Permissions
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Register Resource Modal */}
      <Modal
        title="Register Permission Resource"
        open={isResourceModalOpen}
        onCancel={() => setIsResourceModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={resourceForm}
          layout="vertical"
          onFinish={handleAddResource}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Resource Name"
            name="resource"
            rules={[{ required: true, message: "Please enter resource name" }]}
          >
            <Input placeholder="e.g. menu, stock, audit" />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button onClick={() => setIsResourceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ backgroundColor: "var(--brand-600)" }}
            >
              Register Resource
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
