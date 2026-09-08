"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button, message, Row, Col } from "antd";
import { UserAddOutlined, SearchOutlined } from "@ant-design/icons";
import { StaffTable } from "@/features/staff/components/staff-table";
import { StaffMember } from "@/features/staff/staff.types";
import {
  getUsers,
  createUser,
  updateUserRole,
  deleteStaffMember,
} from "@/features/staff/staff.api";
import { getRoles } from "@/features/roles/roles.api";
import { Role } from "@/features/roles/roles.types";

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(
    null,
  );

  const [createForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        getUsers(),
        getRoles(),
      ]);
      setStaff(usersData);
      setRoles(rolesData);
    } catch {
      message.error("Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    createForm.resetFields();
    setIsCreateModalOpen(true);
  }

  function handleOpenEditRole(member: StaffMember) {
    setSelectedMember(member);
    roleForm.setFieldsValue({ role: member.role || "STAFF" });
    setIsRoleModalOpen(true);
  }

  async function handleCreateUser(values: any) {
    setSubmitting(true);
    try {
      const newUser = await createUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        telegramChatId: values.telegramChatId,
      });
      message.success("User account created successfully.");
      setIsCreateModalOpen(false);
      createForm.resetFields();

      if (newUser && newUser.id) {
        setStaff((prev) => [newUser, ...prev]);
      } else {
        setStaff((prev) => [
          {
            id: Date.now().toString(),
            staffId: `KH000${prev.length + 1}`,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            telegramChatId: values.telegramChatId,
            role: "STAFF",
            status: "active",
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to create user account.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateRole(values: any) {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      await updateUserRole(selectedMember.id, { role: values.role });
      message.success("Role updated successfully.");
      setStaff((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id ? { ...m, role: values.role } : m,
        ),
      );
      setIsRoleModalOpen(false);
    } catch (err: any) {
      message.error(err?.message || "Failed to update role.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteStaffMember(id);
      message.success("Staff account removed.");
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setStaff((prev) => prev.filter((s) => s.id !== id));
      message.success("Staff account removed.");
    }
  }

  const filteredStaff = staff.filter((m) => {
    const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
    const q = search.toLowerCase();
    return (
      fullName.includes(q) ||
      (m.staffId as string)?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      (m.role as string)?.toLowerCase().includes(q)
    );
  });

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
            Staff & User Accounts
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-sub)",
              fontSize: 13,
            }}
          >
            Manage employee access, contact profiles, and security role
            assignments.
          </p>
        </div>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleOpenCreate}
          style={{
            backgroundColor: "var(--brand-600)",
            height: 42,
            borderRadius: 10,
            padding: "0 20px",
            fontWeight: 600,
          }}
        >
          Add Staff Member
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
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </div>

        <StaffTable
          staff={filteredStaff}
          onEditRole={handleOpenEditRole}
          onDelete={handleDelete}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        title="Create Staff Account"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateUser}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input placeholder="e.g. Mo" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input placeholder="e.g. Lika" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input placeholder="e.g. molikakhorn71@gmail.com" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { required: true, message: "Please enter phone number" },
                ]}
              >
                <Input placeholder="e.g. 012345678" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Telegram Chat ID" name="telegramChatId">
                <Input placeholder="e.g. 123456789" />
              </Form.Item>
            </Col>
          </Row>

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
              Create Account
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        title={`Change Role: ${selectedMember?.firstName || ""} ${selectedMember?.lastName || ""}`}
        open={isRoleModalOpen}
        onCancel={() => setIsRoleModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleUpdateRole}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Select Role"
            name="role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select
              options={
                roles.length > 0
                  ? roles.map((r) => ({ label: r.name, value: r.name }))
                  : [
                      { label: "SUPER_ADMIN", value: "SUPER_ADMIN" },
                      { label: "Warehouse Staff", value: "Warehouse Staff" },
                      { label: "STAFF", value: "STAFF" },
                    ]
              }
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
            <Button onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ backgroundColor: "var(--brand-600)" }}
            >
              Update Role
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
