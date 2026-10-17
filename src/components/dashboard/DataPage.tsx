"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Table, Tag, Empty } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Product } from "@/types/inventory";
import { useProductsStore } from "@/store/productsStore";
import { useTheme, ThemeMode } from "@/providers/ThemeProvider";
import CategoriesPage from "@/components/categories/CategoriesPage";
import AddProductPage from "@/components/products/AddProductPage";

const config: Record<
  string,
  { title: string; subtitle: string; add?: string }
> = {
  products: {
    title: "Products",
    subtitle: "Manage your inventory and keep stock levels healthy.",
    add: "Create product",
  },
  "product-details": {
    title: "Product details",
    subtitle: "Review inventory, pricing and stock movement.",
  },
  "create-product": {
    title: "Create product",
    subtitle: "Add a new item to your inventory.",
  },
  brands: {
    title: "Brands",
    subtitle: "Organize products by brand.",
    add: "Add brand",
  },
  categories: {
    title: "Categories",
    subtitle: "Manage product categories.",
    add: "Add category",
  },
  suppliers: {
    title: "Suppliers",
    subtitle: "Manage your suppliers.",
    add: "Add supplier",
  },
  warehouses: {
    title: "Warehouses",
    subtitle: "Track stock across all locations.",
    add: "Add warehouse",
  },
  roles: {
    title: "Roles",
    subtitle: "Configure role-based access.",
    add: "Create role",
  },
  permissions: { title: "Permissions", subtitle: "Review system permissions." },
  "my-requests": {
    title: "My requests",
    subtitle: "Follow the status of your stock requests.",
    add: "New request",
  },
  "my-approvals": {
    title: "My approvals",
    subtitle: "Review requests assigned to you.",
  },
  reports: {
    title: "Reports",
    subtitle: "Understand trends in your inventory.",
  },
  settings: {
    title: "Settings",
    subtitle: "Configure your StockFlow workspace.",
  },
};

export default function DataPage({ section }: { section: string }) {
  const router = useRouter();
  const { products: storeProducts } = useProductsStore();
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  if (section === "manage/categories") return <CategoriesPage />;
  if (section === "products/create" || section === "products/add") {
    return (
      <AddProductPage
        onCancel={() => router.push("/products")}
        onSuccess={() => router.push("/products")}
      />
    );
  }

  const key =
    section === "manage/categories"
      ? "categories"
      : section.startsWith("manage/")
        ? section.split("/")[1]
        : section.split("/")[0] || "products";
  const current = config[key] || {
    title: key.replaceAll("-", " "),
    subtitle: "Manage this area of your workspace.",
  };
  const [query, setQuery] = useState("");
  const { mode, setTheme } = useTheme();
  const isProducts = key === "products";

  const products = useMemo(
    () =>
      storeProducts.filter((item) =>
        `${item.name} ${item.sku} ${item.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [storeProducts, query],
  );

  if (isProducts && isCreatingProduct) {
    return (
      <AddProductPage
        onCancel={() => {
          setIsCreatingProduct(false);
          router.push("/products");
        }}
        onSuccess={() => {
          setIsCreatingProduct(false);
          router.push("/products");
        }}
      />
    );
  }

  return (
    <div
      className={`page-content data-page ${key === "settings" ? "settings-page" : ""}`}
    >
      <div className="page-heading">
        <h1 style={{ textTransform: "capitalize" }}>{current.title}</h1>
        <p>{current.subtitle}</p>
      </div>
      <div className="panel-card">
        {key !== "settings" && (
          <div className="data-toolbar">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Select
              defaultValue="All status"
              options={[
                "All status",
                "In stock",
                "Low stock",
                "Out of stock",
              ].map((value) => ({ value, label: value }))}
            />
            <Button icon={<FilterOutlined />}>Filters</Button>
            {current.add && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (isProducts) {
                    setIsCreatingProduct(true);
                    router.push("/products/create");
                  }
                }}
              >
                {current.add}
              </Button>
            )}
          </div>
        )}
        {key === "settings" ? (
          <div className="settings-content">
            <div className="settings-section">
              <div>
                <h3>Appearance</h3>
                <p>Choose how StockFlow looks for you.</p>
              </div>
            </div>
            <div className="theme-preview-grid">
              {(["light", "dark", "system"] as ThemeMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`theme-preview preview-${item} ${mode === item ? "selected" : ""}`}
                  onClick={() => setTheme(item)}
                  aria-pressed={mode === item}
                >
                  <span className="preview-window" aria-hidden="true">
                    <span className="preview-sidebar" />
                    <span className="preview-content">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                  <strong>{item[0].toUpperCase() + item.slice(1)}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : isProducts ? (
          <Table<Product>
            rowKey="key"
            pagination={{ pageSize: 5 }}
            dataSource={products}
            columns={[
              {
                title: "PRODUCT",
                dataIndex: "name",
                render: (value: string, record) => (
                  <div>
                    <strong>{value}</strong>
                    <div style={{ color: "#888", fontSize: 10 }}>
                      {record.sku}
                    </div>
                  </div>
                ),
              },
              { title: "CATEGORY", dataIndex: "category" },
              { title: "WAREHOUSE", dataIndex: "warehouse" },
              {
                title: "STOCK",
                dataIndex: "stock",
                sorter: (a, b) => a.stock - b.stock,
              },
              {
                title: "STATUS",
                dataIndex: "status",
                render: (value: Product["status"]) => (
                  <Tag
                    color={
                      value === "In stock"
                        ? "green"
                        : value === "Low stock"
                          ? "gold"
                          : "red"
                    }
                  >
                    {value}
                  </Tag>
                ),
              },
              {
                title: "PRICE",
                dataIndex: "price",
                render: (value: number) => `$${value}`,
              },
            ]}
          />
        ) : (
          <div className="empty-state">
            <Empty description="Demo data will appear here as your workspace grows." />
          </div>
        )}
      </div>
    </div>
  );
}
