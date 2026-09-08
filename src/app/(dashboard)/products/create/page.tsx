"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Row,
  Col,
  message,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { getCategories } from "@/features/categories/categories.api";
import { getBrands } from "@/features/brands/brands.api";
import { getWarehouses } from "@/features/warehouses/warehouses.api";
import { getUsers } from "@/features/staff/staff.api";
import { createProductRequest } from "@/features/requests/requests.api";
import { ROUTES } from "@/lib/constants";

export default function CreateProductPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [imageFile, setImageFile] = useState<any>(null);

  const watchedVariants = Form.useWatch("variants", form) || [];
  const variantOptions = (Array.isArray(watchedVariants) ? watchedVariants : [])
    .filter((v: any) => v && (v.variantCode || v.variantName))
    .map((v: any) => ({
      label: `${v.variantName || v.variantCode} (${v.variantCode || "Auto"})`,
      value: v.variantCode || v.variantName,
    }));

  function handleToggleHasVariants(val: boolean) {
    setHasVariants(val);
    if (
      val &&
      (!form.getFieldValue("variants") ||
        form.getFieldValue("variants").length === 0)
    ) {
      const code = form.getFieldValue("productCode") || "PROD";
      form.setFieldsValue({
        variants: [
          {
            variantName: "Standard",
            variantCode: `${code}-V1`,
            variantSku: `${code}-V1`,
            variantCostPrice: form.getFieldValue("costPrice") || 500,
            variantSellingPrice: form.getFieldValue("sellingPrice") || 699,
          },
        ],
      });
    }
  }

  useEffect(() => {
    async function loadFormOptions() {
      try {
        const [cats, brs, whs, usrs] = await Promise.all([
          getCategories(),
          getBrands(),
          getWarehouses(),
          getUsers(),
        ]);
        setCategories(cats);
        setBrands(brs);
        setWarehouses(whs);
        setUsers(usrs);
      } catch {
        // Fallback default options already provided by APIs
      }
    }
    loadFormOptions();
  }, []);

  async function handleSubmit(values: any) {
    setLoading(true);
    try {
      const productCode = (values.productCode || "PROD").toUpperCase();

      const product = {
        productCode: productCode,
        productName: values.productName,
        categoryCode: values.categoryCode,
        brandCode: values.brandCode,
        hasVariants: hasVariants,
        unit: values.unit || "PCS",
        productSku:
          values.productSku ||
          (hasVariants ? productCode : values.singleSku || productCode),
      };

      const variants = hasVariants
        ? (values.variants || []).map((v: any) => ({
            variantCode: v.variantCode || `${productCode}-${v.variantName}`,
            variantName: v.variantName,
            variantSku: v.variantSku || v.variantCode,
            variantCostPrice: Number(v.variantCostPrice) || 0,
            variantSellingPrice: Number(v.variantSellingPrice) || 0,
          }))
        : [
            {
              variantCode: `${productCode}-DEF`,
              variantName: values.productName || "Standard",
              variantSku: values.singleSku || values.productSku || productCode,
              variantCostPrice: Number(values.costPrice) || 0,
              variantSellingPrice: Number(values.sellingPrice) || 0,
            },
          ];

      const stock = (values.stock || []).map((s: any) => ({
        productCode: productCode,
        variantCode: hasVariants
          ? s.variantCode || variants[0]?.variantCode || `${productCode}-DEF`
          : `${productCode}-DEF`,
        warehouseCode: s.warehouseCode,
        quantity: Number(s.quantity) || 0,
      }));

      const approvers = (values.approvers || []).map((a: any) => ({
        userId: a.userId,
        actionType: a.actionType,
      }));

      // Submit as multipart form-data if an image file is attached
      if (imageFile) {
        const formData = new FormData();
        formData.append("requestType", "PRODUCT_CREATE");
        formData.append("product", JSON.stringify(product));
        formData.append("variants", JSON.stringify(variants));
        formData.append("stock", JSON.stringify(stock));
        if (approvers.length > 0) {
          formData.append("approvers", JSON.stringify(approvers));
        }
        formData.append("image", imageFile);
        await createProductRequest(formData);
      } else {
        // Submit as raw JSON payload matching Postman collection
        await createProductRequest({
          requestType: "PRODUCT_CREATE",
          product,
          variants,
          stock,
          approvers,
        });
      }

      message.success("Product intake request submitted successfully!");
      router.push(ROUTES.PRODUCTS);
    } catch (err: any) {
      message.error(err?.message || "Failed to create product intake request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={ROUTES.PRODUCTS}
          style={{
            color: "var(--brand-600)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowLeftOutlined /> Back to Products & Requests
        </Link>
        <h1
          style={{
            margin: "12px 0 0",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-main)",
          }}
        >
          New Product Intake Request
        </h1>
        <p
          style={{ margin: "6px 0 0", color: "var(--text-sub)", fontSize: 13 }}
        >
          Create a new product creation request with variants, warehouse stock
          allocations, and sign-off approvers.
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          unit: "PCS",
          costPrice: 500,
          sellingPrice: 699,
          variants: [
            {
              variantCode: "IP15-BLK-128",
              variantName: "Black / 128GB",
              variantSku: "IP15-BLK-128",
              variantCostPrice: 700,
              variantSellingPrice: 799,
            },
            {
              variantCode: "IP15-BLU-256",
              variantName: "Blue / 256GB",
              variantSku: "IP15-BLU-256",
              variantCostPrice: 780,
              variantSellingPrice: 899,
            },
          ],
          stock: [
            {
              variantCode: "IP15-BLK-128",
              warehouseCode: "WH001",
              quantity: 50,
            },
          ],
          approvers: [
            {
              userId: "693a56ed-5436-4756-ba32-ff09e691fbfd",
              actionType: "CERTIFIER",
            },
            {
              userId: "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
              actionType: "APPROVER",
            },
          ],
        }}
      >
        {/* Card 1: Basic Product Information */}
        <div
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            backgroundColor: "var(--bg-card)",
            boxShadow: "var(--card-shadow)",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            {hasVariants
              ? "1. Master Product Information"
              : "1. Master Product & Pricing Information"}
          </h3>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Product Code"
                name="productCode"
                rules={[
                  { required: true, message: "Please enter product code" },
                ]}
              >
                <Input
                  placeholder="e.g. IP15"
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                label="Product Name"
                name="productName"
                rules={[
                  { required: true, message: "Please enter product name" },
                ]}
              >
                <Input placeholder="e.g. iPhone 15" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Master SKU" name="productSku">
                <Input placeholder="e.g. IP15" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Category"
                name="categoryCode"
                rules={[{ required: true, message: "Select category" }]}
              >
                <Select
                  placeholder="Select Category"
                  options={
                    categories.length > 0
                      ? categories.map((c) => ({
                          label: `${c.name} (${c.code})`,
                          value: c.code,
                        }))
                      : [
                          {
                            label: "Smartphone (SMARTPHONE)",
                            value: "SMARTPHONE",
                          },
                          { label: "Computer (COMPUTER)", value: "COMPUTER" },
                        ]
                  }
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Brand"
                name="brandCode"
                rules={[{ required: true, message: "Select brand" }]}
              >
                <Select
                  placeholder="Select Brand"
                  options={
                    brands.length > 0
                      ? brands.map((b) => ({
                          label: `${b.name} (${b.code})`,
                          value: b.code,
                        }))
                      : [
                          { label: "Apple (APPLE)", value: "APPLE" },
                          { label: "Samsung (SAMSUNG)", value: "SAMSUNG" },
                        ]
                  }
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Unit" name="unit">
                <Input placeholder="PCS" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Has Variants?"
                tooltip="Select 'Yes' if this product comes in multiple variations (e.g. colors, sizes, memory)"
              >
                <Select
                  value={hasVariants}
                  onChange={handleToggleHasVariants}
                  options={[
                    { label: "No (Single / Standard Product)", value: false },
                    { label: "Yes (Product with Variants)", value: true },
                  ]}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {!hasVariants && (
            <div
              style={{
                marginTop: 8,
                marginBottom: 16,
                padding: 16,
                borderRadius: 12,
                backgroundColor: "var(--bg-app)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-main)",
                  marginBottom: 12,
                }}
              >
                Single Product Pricing & Identifiers
              </div>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Cost Price ($)"
                    name="costPrice"
                    rules={[
                      { required: true, message: "Please enter cost price" },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: "100%" }}
                      placeholder="e.g. 500"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Selling Price ($)"
                    name="sellingPrice"
                    rules={[
                      { required: true, message: "Please enter selling price" },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: "100%" }}
                      placeholder="e.g. 699"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Barcode / Single SKU" name="singleSku">
                    <Input placeholder="e.g. SKU-1001" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          <Form.Item label="Product Catalog Image (Optional)">
            <Upload
              maxCount={1}
              beforeUpload={(file) => {
                setImageFile(file);
                return false;
              }}
              onRemove={() => setImageFile(null)}
            >
              <Button icon={<UploadOutlined />}>Select Image File</Button>
            </Upload>
          </Form.Item>
        </div>

        {/* Card 2: Product Variants (Only appears if hasVariants is selected) */}
        {hasVariants && (
          <div
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: 16,
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)",
              padding: 24,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-main)",
                  }}
                >
                  2. Product Variants & Pricing
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  Define variations (color, storage size, specs) with individual
                  pricing and SKUs.
                </p>
              </div>
            </div>

            <Form.List name="variants">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row
                      key={key}
                      gutter={12}
                      align="middle"
                      style={{
                        marginBottom: 12,
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor: "rgba(124, 58, 237, 0.03)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "variantName"]}
                          label="Variant Name"
                          rules={[{ required: true, message: "Required" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="e.g. Black / 128GB" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "variantCode"]}
                          label="Variant Code"
                          rules={[{ required: true, message: "Required" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="e.g. IP15-BLK-128" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "variantCostPrice"]}
                          label="Cost Price ($)"
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            style={{ width: "100%" }}
                            placeholder="700"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "variantSellingPrice"]}
                          label="Selling Price ($)"
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            style={{ width: "100%" }}
                            placeholder="799"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "variantSku"]}
                          label="Variant SKU"
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="IP15-BLK-128" />
                        </Form.Item>
                      </Col>
                      <Col
                        span={1}
                        style={{ textAlign: "center", paddingTop: 24 }}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: 8 }}
                  >
                    Add Variant
                  </Button>
                </>
              )}
            </Form.List>
          </div>
        )}

        {/* Warehouse Stock Intake Allocation */}
        <div
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            backgroundColor: "var(--bg-card)",
            boxShadow: "var(--card-shadow)",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            {hasVariants ? "3." : "2."} Warehouse Stock Intake Allocation
          </h3>

          <Form.List name="stock">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row
                    key={key}
                    gutter={12}
                    align="middle"
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: "rgba(16, 185, 129, 0.03)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {hasVariants && (
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, "variantCode"]}
                          label="Target Variant"
                          rules={[{ required: true, message: "Required" }]}
                          style={{ marginBottom: 0 }}
                        >
                          {variantOptions.length > 0 ? (
                            <Select
                              placeholder="Select Target Variant"
                              options={variantOptions}
                            />
                          ) : (
                            <Input placeholder="e.g. IP15-BLK-128" />
                          )}
                        </Form.Item>
                      </Col>
                    )}
                    <Col span={hasVariants ? 8 : 14}>
                      <Form.Item
                        {...restField}
                        name={[name, "warehouseCode"]}
                        label="Destination Warehouse"
                        rules={[
                          { required: true, message: "Select warehouse" },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="Select Warehouse"
                          options={
                            warehouses.length > 0
                              ? warehouses.map((w) => ({
                                  label: `${w.name} (${w.code})`,
                                  value: w.code,
                                }))
                              : [
                                  {
                                    label: "Main Phnom Penh (WH001)",
                                    value: "WH001",
                                  },
                                  {
                                    label: "Siem Reap (WH002)",
                                    value: "WH002",
                                  },
                                ]
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={hasVariants ? 5 : 9}>
                      <Form.Item
                        {...restField}
                        name={[name, "quantity"]}
                        label="Intake Quantity"
                        rules={[{ required: true, message: "Required" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={1}
                          style={{ width: "100%" }}
                          placeholder="50"
                        />
                      </Form.Item>
                    </Col>
                    <Col
                      span={1}
                      style={{ textAlign: "center", paddingTop: 24 }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                >
                  Add Warehouse Stock Allocation
                </Button>
              </>
            )}
          </Form.List>
        </div>

        {/* Approvers Signoff Workflow */}
        <div
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            backgroundColor: "var(--bg-card)",
            boxShadow: "var(--card-shadow)",
            padding: 24,
            marginBottom: 28,
          }}
        >
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-main)",
            }}
          >
            {hasVariants ? "4." : "3."} Approvers & Verification Workflow
          </h3>

          <Form.List name="approvers">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row
                    key={key}
                    gutter={12}
                    align="middle"
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: "rgba(59, 130, 246, 0.03)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <Col span={14}>
                      <Form.Item
                        {...restField}
                        name={[name, "userId"]}
                        label="Staff Reviewer"
                        rules={[{ required: true, message: "Select reviewer" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="Select Staff Member"
                          options={
                            users.length > 0
                              ? users.map((u) => ({
                                  label: `${u.firstName} ${u.lastName} (${u.role || "STAFF"})`,
                                  value: u.id,
                                }))
                              : [
                                  {
                                    label: "Alex Johnson (SUPER_ADMIN)",
                                    value:
                                      "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
                                  },
                                  {
                                    label: "Samantha Lee (STAFF)",
                                    value:
                                      "693a56ed-5436-4756-ba32-ff09e691fbfd",
                                  },
                                ]
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={9}>
                      <Form.Item
                        {...restField}
                        name={[name, "actionType"]}
                        label="Signoff Role"
                        rules={[{ required: true, message: "Select role" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          options={[
                            {
                              label: "CERTIFIER (Warehouse Verifier)",
                              value: "CERTIFIER",
                            },
                            {
                              label: "APPROVER (Final Signoff)",
                              value: "APPROVER",
                            },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col
                      span={1}
                      style={{ textAlign: "center", paddingTop: 24 }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                >
                  Add Approver
                </Button>
              </>
            )}
          </Form.List>
        </div>

        {/* Form Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
          <Link href={ROUTES.PRODUCTS}>
            <Button size="large">Cancel</Button>
          </Link>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<CheckOutlined />}
            style={{
              backgroundColor: "var(--brand-600)",
              padding: "0 32px",
              fontWeight: 600,
            }}
          >
            Submit Intake Request
          </Button>
        </div>
      </Form>
    </div>
  );
}
