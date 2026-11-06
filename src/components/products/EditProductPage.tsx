"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Form, Input, InputNumber, Select, message } from "antd";
import { ArrowLeftOutlined, CameraOutlined } from "@ant-design/icons";
import { ApiError } from "@/features/live/http";
import { LookupOption, fetchBrands, fetchCategories, fetchSuppliers } from "@/features/live/lookups";
import { ProductDetail, fetchProduct, updateProduct, updateProductImage } from "@/features/products/products-live.api";
import { LiveState, errorText } from "@/components/common/live-state";
import { useStockStore } from "@/store/stockStore";
import Can from "@/components/common/Can";

interface FormValues {
  name: string;
  sku: string;
  barcode?: string;
  unit: string;
  description?: string;
  categoryCode: string;
  brandCode?: string;
  supplierCode?: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock?: number | null;
  variants?: { code: string; name: string; sku: string; barcode?: string; costPrice?: number | null; sellingPrice?: number | null }[];
}

const opts = (list: LookupOption[]) => list.map((o) => ({ value: o.code, label: o.name }));

export default function EditProductPage({ productId }: { productId: string }) {
  const router = useRouter();
  const [messageApi, holder] = message.useMessage();
  const [form] = Form.useForm<FormValues>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [suppliers, setSuppliers] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { reload: reloadStock } = useStockStore();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [p, c, b, s] = await Promise.all([fetchProduct(productId), fetchCategories(), fetchBrands(), fetchSuppliers()]);
      setProduct(p);
      setCategories(c);
      setBrands(b);
      setSuppliers(s);
      form.setFieldsValue({
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        unit: p.unit,
        description: p.description,
        categoryCode: p.categoryCode || undefined,
        brandCode: p.brandCode || undefined,
        supplierCode: p.supplierCode || undefined,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        minimumStock: p.minimumStock,
        maximumStock: p.maximumStock,
        variants: p.variants.map((v) => ({ code: v.code, name: v.name, sku: v.sku, barcode: v.barcode, costPrice: v.costPrice, sellingPrice: v.sellingPrice })),
      });
    } catch (e) {
      setError(errorText(e, "Could not load this product."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function pickPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      messageApi.error("Please choose an image file.");
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function save(v: FormValues) {
    setSaving(true);
    try {
      await updateProduct(productId, {
        name: v.name.trim(),
        sku: v.sku.trim(),
        barcode: (v.barcode ?? "").trim(),
        unit: v.unit.trim(),
        description: (v.description ?? "").trim(),
        categoryCode: v.categoryCode,
        brandCode: v.brandCode ?? "",
        supplierCode: v.supplierCode ?? "",
        costPrice: v.costPrice ?? 0,
        sellingPrice: v.sellingPrice ?? 0,
        minimumStock: v.minimumStock ?? 0,
        maximumStock: v.maximumStock ?? null,
        variants: v.variants?.map((x) => ({
          code: x.code,
          name: x.name.trim(),
          sku: x.sku.trim(),
          barcode: (x.barcode ?? "").trim(),
          costPrice: x.costPrice ?? null,
          sellingPrice: x.sellingPrice ?? null,
        })),
      });
      if (photo) {
        try {
          await updateProductImage(productId, photo);
        } catch (e) {
          messageApi.warning(e instanceof ApiError ? `Saved, but the photo failed: ${e.message}` : "Saved, but the photo could not be uploaded.");
        }
      }
      void reloadStock();
      messageApi.success("Product updated.");
      setTimeout(() => router.push(`/products/${productId}`), 500);
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  }

  const shownImage = preview ?? product?.image;

  return (
    <div className="page-content data-page">
      {holder}
      <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
        <Button shape="circle" icon={<ArrowLeftOutlined />} aria-label="Back to product" onClick={() => router.push(`/products/${productId}`)} />
        <Link href="/products" style={{ color: "var(--muted)", fontWeight: 600, textDecoration: "none" }}>Products</Link>
        <span aria-hidden="true" style={{ color: "var(--muted)", opacity: 0.6 }}>/</span>
        <span style={{ fontWeight: 700 }}>Edit {product?.name ?? "product"}</span>
      </nav>

      <LiveState loading={loading} error={error} onRetry={load}>
        <Form form={form} layout="vertical" onFinish={save} requiredMark={false} style={{ marginTop: 16, maxWidth: 900 }}>
          <div className="panel-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Photo</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {shownImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownImage} alt="" width={80} height={80} style={{ borderRadius: 16, objectFit: "cover" }} />
              ) : (
                <span aria-hidden="true" style={{ width: 80, height: 80, borderRadius: 16, background: "rgba(124,58,237,0.12)", display: "grid", placeItems: "center", color: "var(--purple)", fontSize: 28 }}>
                  <CameraOutlined />
                </span>
              )}
              <Can any="PRODUCT_IMAGE" fallback={<span style={{ color: "var(--muted)", fontSize: 13 }}>You can&apos;t change the photo.</span>}>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
                <Button icon={<CameraOutlined />} onClick={() => fileRef.current?.click()}>
                  {photo ? "Choose another photo" : "Change photo"}
                </Button>
              </Can>
            </div>
          </div>

          <div className="panel-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Basic information</h2>
            <Form.Item name="name" label="Product name" rules={[{ required: true, message: "Product name is required" }, { max: 200 }]}>
              <Input />
            </Form.Item>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
              <Form.Item name="sku" label="SKU" rules={[{ required: true, message: "SKU is required" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="barcode" label="Barcode" extra="Leave empty to generate a new one.">
                <Input />
              </Form.Item>
              <Form.Item name="unit" label="Unit" rules={[{ required: true, message: "Unit is required" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="categoryCode" label="Category" rules={[{ required: true, message: "Choose a category" }]}>
                <Select showSearch optionFilterProp="label" options={opts(categories)} />
              </Form.Item>
              <Form.Item name="brandCode" label="Brand">
                <Select allowClear showSearch optionFilterProp="label" options={opts(brands)} placeholder="No brand" />
              </Form.Item>
              <Form.Item name="supplierCode" label="Supplier">
                <Select allowClear showSearch optionFilterProp="label" options={opts(suppliers)} placeholder="No supplier" />
              </Form.Item>
            </div>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </div>

          <div className="panel-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Pricing and stock rules</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 16px" }}>
              <Form.Item name="costPrice" label="Cost price ($)" rules={[{ required: true, message: "Required" }]}>
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="sellingPrice" label="Sale price ($)" rules={[{ required: true, message: "Required" }]}>
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="minimumStock" label="Minimum stock" rules={[{ required: true, message: "Required" }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="maximumStock" label="Maximum stock">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="No limit" />
              </Form.Item>
            </div>
          </div>

          {(product?.variants.length ?? 0) > 0 && (
            <div className="panel-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Variants</h2>
              <Form.List name="variants">
                {(fields) =>
                  fields.map((f) => (
                    <div key={f.key} style={{ padding: "12px 0", borderTop: f.name ? "1px solid rgba(114,117,139,0.15)" : "none" }}>
                      <Form.Item name={[f.name, "code"]} hidden>
                        <Input />
                      </Form.Item>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0 16px" }}>
                        <Form.Item name={[f.name, "name"]} label="Name" rules={[{ required: true, message: "Required" }]}>
                          <Input />
                        </Form.Item>
                        <Form.Item name={[f.name, "sku"]} label="SKU" rules={[{ required: true, message: "Required" }]}>
                          <Input />
                        </Form.Item>
                        <Form.Item name={[f.name, "barcode"]} label="Barcode">
                          <Input />
                        </Form.Item>
                        <Form.Item name={[f.name, "costPrice"]} label="Cost ($)">
                          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name={[f.name, "sellingPrice"]} label="Price ($)">
                          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
                        </Form.Item>
                      </div>
                    </div>
                  ))
                }
              </Form.List>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button onClick={() => router.push(`/products/${productId}`)} disabled={saving}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>Save changes</Button>
          </div>
        </Form>
      </LiveState>
    </div>
  );
}
