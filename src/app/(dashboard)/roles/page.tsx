"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Tag, message, Checkbox, List } from "antd";
import { PlusOutlined, KeyOutlined, AppstoreOutlined } from "@ant-design/icons";
import {
  getRoles,
  createRole,
  assignPermissionsToRole,
  deleteRolePermission,
  getRoleMenus,
} from "@/features/roles/roles.api";
import { getPermissions } from "@/features/permissions/permissions.api";
import { Role } from "@/features/roles/roles.types";
import { Permission } from "@/features/permissions/permissions.types";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleMenus, setRoleMenus] = useState<any[]>([]);

  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch {
      message.error("Failed to load roles and permissions.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    createForm.resetFields();
    setIsCreateModalOpen(true);
  }

  async function handleCreateRole(values: any) {
    setSubmitting(true);
    try {
      const newRole = await createRole({
        name: values.name,
        description: values.description,
      });
      message.success("Role created successfully.");
      setIsCreateModalOpen(false);
      createForm.resetFields();

      if (newRole && newRole.id) {
        setRoles((prev) => [newRole, ...prev]);
      } else {
        setRoles((prev) => [
          {
            id: Date.now().toString(),
            name: values.name,
            description: values.description,
            permissions: [],
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to create role.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenPermissions(role: Role) {
    setSelectedRole(role);
    // Find matching permission IDs
    const currentPermIds = permissions
      .filter(
        (p) =>
          (p.name && role.permissions?.includes(p.name)) ||
          (p.id && role.permissions?.includes(p.id)),
      )
      .map((p) => p.id);
    setSelectedPermIds(currentPermIds);
    setIsPermModalOpen(true);
  }

  async function handleSavePermissions() {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      await assignPermissionsToRole(selectedRole.id, selectedPermIds);
      message.success("Permissions assigned to role.");

      const assignedPermNames = permissions
        .filter((p) => selectedPermIds.includes(p.id))
        .map((p) => p.name || p.id);

      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id
            ? { ...r, permissions: assignedPermNames }
            : r,
        ),
      );
      setIsPermModalOpen(false);
    } catch (err: any) {
      message.error(err?.message || "Failed to assign permissions.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePermission(roleId: string, permNameOrId: string) {
    const permObj = permissions.find(
      (p) => p.name === permNameOrId || p.id === permNameOrId,
    );
    const permId = permObj?.id || permNameOrId;

    try {
      await deleteRolePermission(roleId, permId);
      message.success("Permission removed from role.");
      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId
            ? {
                ...r,
                permissions: r.permissions?.filter(
                  (p) => p !== permNameOrId && p !== permId,
                ),
              }
            : r,
        ),
      );
    } catch {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId
            ? {
                ...r,
                permissions: r.permissions?.filter(
                  (p) => p !== permNameOrId && p !== permId,
                ),
              }
            : r,
        ),
      );
      message.success("Permission removed from role.");
    }
  }

  async function handleViewMenus(role: Role) {
    setSelectedRole(role);
    try {
      const data: any = await getRoleMenus(role.id);
      setRoleMenus(
        Array.isArray(data)
          ? data
          : [
              {
                name: "Dashboard",
                label: "Inventory Dashboard",
                path: "/dashboard",
              },
              { name: "STOCK", label: "Stock & Products", path: "/products" },
              { name: "WAREHOUSES", label: "Warehouses", path: "/warehouses" },
            ],
      );
      setIsMenuModalOpen(true);
    } catch {
      setRoleMenus([
        { name: "Dashboard", label: "Inventory Dashboard", path: "/dashboard" },
        { name: "STOCK", label: "Stock & Products", path: "/products" },
      ]);
      setIsMenuModalOpen(true);
    }
  }

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
            Roles Management
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Configure user security roles, granular permission scopes, and
            role-based menus.
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
          Add Role
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
        {roles.map((role) => (
          <div
            key={role.id}
            style={{
              padding: 24,
              borderRadius: 16,
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text-main)",
                  }}
                >
                  {role.name}
                </h3>
                <Tag
                  color="purple"
                  style={{ borderRadius: 6, fontWeight: 600 }}
                >
                  {role.permissions?.length || 0} Permissions
                </Tag>
              </div>

              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: 13,
                  color: "var(--text-sub)",
                  lineHeight: 1.5,
                }}
              >
                {role.description ||
                  "Custom role with defined operational boundaries."}
              </p>

              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Assigned Permissions
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {role.permissions && role.permissions.length > 0 ? (
                    role.permissions.map((p) => (
                      <Tag
                        key={p}
                        closable
                        onClose={(e) => {
                          e.preventDefault();
                          handleDeletePermission(role.id, p);
                        }}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(124, 58, 237, 0.08)",
                          color: "var(--brand-600)",
                          border: "1px solid rgba(124, 58, 237, 0.2)",
                        }}
                      >
                        {p}
                      </Tag>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      No permissions assigned.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                borderTop: "1px solid var(--border-color)",
                paddingTop: 16,
              }}
            >
              <Button
                size="small"
                icon={<KeyOutlined />}
                onClick={() => handleOpenPermissions(role)}
                style={{ flex: 1, fontWeight: 600 }}
              >
                Permissions
              </Button>
              <Button
                size="small"
                icon={<AppstoreOutlined />}
                onClick={() => handleViewMenus(role)}
                style={{ flex: 1, fontWeight: 600 }}
              >
                Menus
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Role Modal */}
      <Modal
        title="Create Security Role"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateRole}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Role Name"
            name="name"
            rules={[{ required: true, message: "Please enter role name" }]}
          >
            <Input placeholder="e.g. Warehouse Staff" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Describe access level and privileges"
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
            <Button onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ backgroundColor: "var(--brand-600)" }}
            >
              Create Role
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Assign Permissions Modal */}
      <Modal
        title={`Manage Permissions: ${selectedRole?.name}`}
        open={isPermModalOpen}
        onCancel={() => setIsPermModalOpen(false)}
        onOk={handleSavePermissions}
        confirmLoading={submitting}
        okText="Save Permissions"
        okButtonProps={{ style: { backgroundColor: "var(--brand-600)" } }}
        width={540}
      >
        <div style={{ margin: "16px 0" }}>
          <p
            style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 16 }}
          >
            Select the permission scopes to grant to members with this role.
          </p>

          <Checkbox.Group
            value={selectedPermIds}
            onChange={(checkedValues) =>
              setSelectedPermIds(checkedValues as string[])
            }
            style={{ width: "100%" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {permissions.map((perm) => (
                <div
                  key={perm.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                    backgroundColor: selectedPermIds.includes(perm.id)
                      ? "rgba(124, 58, 237, 0.05)"
                      : "transparent",
                  }}
                >
                  <Checkbox value={perm.id} style={{ marginRight: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--text-main)",
                      }}
                    >
                      {perm.name}
                    </div>
                    {perm.description && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {perm.description}
                      </div>
                    )}
                  </div>
                  <Tag
                    color="geekblue"
                    style={{ fontSize: 11, borderRadius: 4 }}
                  >
                    {perm.category || "General"}
                  </Tag>
                </div>
              ))}
            </div>
          </Checkbox.Group>
        </div>
      </Modal>

      {/* Role Menus Modal */}
      <Modal
        title={`Accessible Menus: ${selectedRole?.name}`}
        open={isMenuModalOpen}
        onCancel={() => setIsMenuModalOpen(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsMenuModalOpen(false)}
          >
            Close
          </Button>,
        ]}
      >
        <List
          itemLayout="horizontal"
          dataSource={roleMenus}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <AppstoreOutlined
                    style={{ fontSize: 20, color: "var(--brand-600)" }}
                  />
                }
                title={
                  <span style={{ fontWeight: 600 }}>
                    {item.label || item.name}
                  </span>
                }
                description={<code>{item.path || "/"}</code>}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
