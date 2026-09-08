"use client";

import React from "react";
import Link from "next/link";
import { Tag, Popconfirm, Button, Space } from "antd";
import { Table, Column } from "@/components/ui/table";
import { Product } from "../products.types";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface ProductTableProps {
  products: Product[];
  onDelete?: (id: string) => void;
}

export function ProductTable({ products, onDelete }: ProductTableProps) {
  const columns: Column<Product>[] = [
    {
      key: "sku",
      header: "SKU",
      render: (product) => (
        <code
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            color: "var(--brand-600)",
            background: "rgba(124, 58, 237, 0.08)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {product.sku}
        </code>
      ),
    },
    {
      key: "name",
      header: "Product Name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (product) => (
        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
          {product.name}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sorter: (a, b) => a.category.localeCompare(b.category),
      render: (product) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 500 }}>
          {product.category}
        </Tag>
      ),
    },
    {
      key: "price",
      header: "Price",
      sorter: (a, b) => a.price - b.price,
      render: (product) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</span>
      ),
    },
    {
      key: "stock",
      header: "In Stock",
      sorter: (a, b) => a.stock - b.stock,
      render: (product) => {
        const isLow = product.stock <= 5;
        return (
          <span
            style={{
              fontWeight: 600,
              color: isLow ? "#ef4444" : "var(--text-main)",
            }}
          >
            {product.stock}{" "}
            {isLow && (
              <Tag color="warning" style={{ marginLeft: 6, fontSize: 11 }}>
                Low
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (product) => (
        <Tag
          color={product.status === "active" ? "success" : "default"}
          style={{
            borderRadius: 6,
            textTransform: "capitalize",
            fontWeight: 600,
          }}
        >
          {product.status}
        </Tag>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (product) => (
        <Space size="middle">
          <Link href={`${ROUTES.PRODUCTS}/${product.id}`}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, fontWeight: 600 }}
            >
              Edit
            </Button>
          </Link>
          {onDelete && (
            <Popconfirm
              title="Delete Product"
              description={`Are you sure you want to delete "${product.name}"?`}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(product.id)}
            >
              <Button
                type="link"
                danger
                size="small"
                style={{ padding: 0, fontWeight: 600 }}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={products}
      emptyText="No products found in inventory."
    />
  );
}
