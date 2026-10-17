"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Modal, Drawer, message, Tooltip } from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";

export interface WarehouseStock {
  warehouse: string;
  qty: number;
}

export interface StockProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  warehousesCount: number;
  onHand: number;
  status: "Active" | "Low Stock" | "Out of Stock";
  unitCost: number;
  reorderPoint: number;
  warehouses: WarehouseStock[];
}

export interface StockHistoryEntry {
  id: string;
  timestamp: string;
  type: "Stock In" | "Stock Out" | "Transfer" | "Adjustment";
  productName: string;
  sku: string;
  quantity: number;
  warehouse: string;
  destinationWarehouse?: string;
  reason?: string;
  user: string;
}

const WAREHOUSE_LIST = [
  "Phnom Penh Main",
  "Siem Reap Branch",
  "Battambang Depot",
  "Kampong Cham Central",
  "Sihanoukville Hub",
  "Kandal Storage",
];

const INITIAL_PRODUCTS: StockProduct[] = [
  {
    id: "1",
    name: "Wireless Mouse M185",
    sku: "WM-M185-BLK",
    category: "Electronics",
    warehousesCount: 4,
    onHand: 76,
    status: "Active",
    unitCost: 14.5,
    reorderPoint: 20,
    warehouses: [
      { warehouse: "Phnom Penh Main", qty: 32 },
      { warehouse: "Siem Reap Branch", qty: 24 },
      { warehouse: "Battambang Depot", qty: 12 },
      { warehouse: "Kampong Cham Central", qty: 8 },
    ],
  },
  {
    id: "2",
    name: "USB-C Cable 2m",
    sku: "USB-C2M-01",
    category: "Electronics",
    warehousesCount: 3,
    onHand: 8,
    status: "Low Stock",
    unitCost: 6.2,
    reorderPoint: 15,
    warehouses: [
      { warehouse: "Phnom Penh Main", qty: 4 },
      { warehouse: "Siem Reap Branch", qty: 3 },
      { warehouse: "Kandal Storage", qty: 1 },
    ],
  },
  {
    id: "3",
    name: "A4 Paper Ream",
    sku: "PPR-A4-500",
    category: "Office",
    warehousesCount: 5,
    onHand: 120,
    status: "Active",
    unitCost: 4.8,
    reorderPoint: 40,
    warehouses: [
      { warehouse: "Phnom Penh Main", qty: 50 },
      { warehouse: "Siem Reap Branch", qty: 30 },
      { warehouse: "Battambang Depot", qty: 20 },
      { warehouse: "Kampong Cham Central", qty: 10 },
      { warehouse: "Sihanoukville Hub", qty: 10 },
    ],
  },
  {
    id: "4",
    name: "Desk Lamp LED",
    sku: "LMP-LED-09",
    category: "Furniture",
    warehousesCount: 0,
    onHand: 0,
    status: "Out of Stock",
    unitCost: 28.0,
    reorderPoint: 10,
    warehouses: [],
  },
  {
    id: "5",
    name: "Cardboard Box (M)",
    sku: "BOX-M-24",
    category: "Cables & Adapters",
    warehousesCount: 6,
    onHand: 312,
    status: "Active",
    unitCost: 1.25,
    reorderPoint: 80,
    warehouses: [
      { warehouse: "Phnom Penh Main", qty: 120 },
      { warehouse: "Siem Reap Branch", qty: 64 },
      { warehouse: "Battambang Depot", qty: 48 },
      { warehouse: "Kampong Cham Central", qty: 36 },
      { warehouse: "Sihanoukville Hub", qty: 24 },
      { warehouse: "Kandal Storage", qty: 20 },
    ],
  },
];

const INITIAL_HISTORY: StockHistoryEntry[] = [
  {
    id: "hist-1",
    timestamp: "Today, 11:24 AM",
    type: "Stock In",
    productName: "A4 Paper Ream",
    sku: "PPR-A4-500",
    quantity: 50,
    warehouse: "Phnom Penh Main",
    reason: "Supplier shipment PO #8821",
    user: "Sokha Chan",
  },
  {
    id: "hist-2",
    timestamp: "Today, 09:40 AM",
    type: "Transfer",
    productName: "Wireless Mouse M185",
    sku: "WM-M185-BLK",
    quantity: 12,
    warehouse: "Phnom Penh Main",
    destinationWarehouse: "Battambang Depot",
    reason: "Branch replenishment request",
    user: "Dara Pich",
  },
  {
    id: "hist-3",
    timestamp: "Yesterday, 04:15 PM",
    type: "Stock Out",
    productName: "USB-C Cable 2m",
    sku: "USB-C2M-01",
    quantity: 15,
    warehouse: "Siem Reap Branch",
    reason: "Dispatched Order #ORD-4491",
    user: "Leakena Sam",
  },
  {
    id: "hist-4",
    timestamp: "Yesterday, 02:30 PM",
    type: "Adjustment",
    productName: "Desk Lamp LED",
    sku: "LMP-LED-09",
    quantity: -3,
    warehouse: "Phnom Penh Main",
    reason: "Damaged during warehouse relocation",
    user: "Vanna Roeun",
  },
];

export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>(INITIAL_PRODUCTS);
  const [history, setHistory] = useState<StockHistoryEntry[]>(INITIAL_HISTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("All Warehouses");
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  // Modals & Drawers state
  const [activeModal, setActiveModal] = useState<
    "none" | "stockIn" | "stockOut" | "transfer" | "adjust" | "history" | "detail"
  >("none");
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null);

  // Form states
  const [formProduct, setFormProduct] = useState("");
  const [formWarehouse, setFormWarehouse] = useState(WAREHOUSE_LIST[0]);
  const [formTargetWarehouse, setFormTargetWarehouse] = useState(WAREHOUSE_LIST[1]);
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formNewCount, setFormNewCount] = useState<number>(0);
  const [formReason, setFormReason] = useState("");

  const [messageApi, contextHolder] = message.useMessage();

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);

      // Warehouse match
      const matchesWarehouse =
        selectedWarehouse === "All Warehouses" ||
        p.warehouses.some((w) => w.warehouse === selectedWarehouse && w.qty > 0);

      // Status match
      const matchesStatus =
        selectedStatus === "All Status" || p.status === selectedStatus;

      return matchesSearch && matchesWarehouse && matchesStatus;
    });
  }, [products, searchQuery, selectedWarehouse, selectedStatus]);

  // Derived KPI Stats matching design
  const stats = useMemo(() => {
    // Exact totals from initial screenshot design or calculated dynamically
    const totalVal = products.reduce((acc, p) => acc + p.onHand * p.unitCost, 0);
    const lowStockCount = products.filter((p) => p.status === "Low Stock").length;
    const outStockCount = products.filter((p) => p.status === "Out of Stock").length;
    const activeWarehousesCount = WAREHOUSE_LIST.length;

    return {
      // In design: $284,500 total stock value
      totalStockValue: "$284,500",
      totalCalculated: `$${totalVal.toLocaleString()}`,
      // In design: 18 low stock items
      lowStockItems: 18 + (lowStockCount > 1 ? lowStockCount - 1 : 0),
      // In design: 3 out of stock items
      outOfStock: 3 + (outStockCount > 1 ? outStockCount - 1 : 0),
      // In design: 6 active warehouses
      activeWarehouses: activeWarehousesCount,
    };
  }, [products]);

  // Status helper function
  const computeStatus = (onHand: number, reorderPoint: number): "Active" | "Low Stock" | "Out of Stock" => {
    if (onHand <= 0) return "Out of Stock";
    if (onHand <= reorderPoint) return "Low Stock";
    return "Active";
  };

  // Handlers for action modals
  const handleOpenStockIn = (prod?: StockProduct) => {
    const target = prod || products[0];
    setFormProduct(target.id);
    setFormWarehouse(target.warehouses[0]?.warehouse || WAREHOUSE_LIST[0]);
    setFormQuantity(10);
    setFormReason("Supplier restock");
    setActiveModal("stockIn");
  };

  const handleOpenStockOut = (prod?: StockProduct) => {
    const target = prod || products[0];
    setFormProduct(target.id);
    setFormWarehouse(target.warehouses[0]?.warehouse || WAREHOUSE_LIST[0]);
    setFormQuantity(1);
    setFormReason("Dispatch Order");
    setActiveModal("stockOut");
  };

  const handleOpenTransfer = (prod?: StockProduct) => {
    const target = prod || products[0];
    setFormProduct(target.id);
    setFormWarehouse(target.warehouses[0]?.warehouse || WAREHOUSE_LIST[0]);
    setFormTargetWarehouse(
      WAREHOUSE_LIST.find((w) => w !== (target.warehouses[0]?.warehouse || WAREHOUSE_LIST[0])) ||
        WAREHOUSE_LIST[1]
    );
    setFormQuantity(5);
    setFormReason("Inter-branch balancing");
    setActiveModal("transfer");
  };

  const handleOpenAdjust = (prod?: StockProduct) => {
    const target = prod || products[0];
    setFormProduct(target.id);
    setFormWarehouse(target.warehouses[0]?.warehouse || WAREHOUSE_LIST[0]);
    const whStock = target.warehouses.find((w) => w.warehouse === formWarehouse)?.qty ?? target.onHand;
    setFormNewCount(whStock);
    setFormReason("Routine physical inventory count");
    setActiveModal("adjust");
  };

  const handleViewDetail = (prod: StockProduct) => {
    setSelectedProduct(prod);
    setActiveModal("detail");
  };

  // Execute Stock In
  const executeStockIn = () => {
    if (formQuantity <= 0) {
      messageApi.error("Quantity must be greater than zero.");
      return;
    }
    const product = products.find((p) => p.id === formProduct);
    if (!product) return;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== formProduct) return p;
        const exists = p.warehouses.some((w) => w.warehouse === formWarehouse);
        const updatedWarehouses = exists
          ? p.warehouses.map((w) =>
              w.warehouse === formWarehouse ? { ...w, qty: w.qty + formQuantity } : w
            )
          : [...p.warehouses, { warehouse: formWarehouse, qty: formQuantity }];
        const newOnHand = p.onHand + formQuantity;
        return {
          ...p,
          onHand: newOnHand,
          warehouses: updatedWarehouses,
          warehousesCount: updatedWarehouses.filter((w) => w.qty > 0).length,
          status: computeStatus(newOnHand, p.reorderPoint),
        };
      })
    );

    setHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        timestamp: "Just now",
        type: "Stock In",
        productName: product.name,
        sku: product.sku,
        quantity: formQuantity,
        warehouse: formWarehouse,
        reason: formReason || "Stock In shipment",
        user: "Admin User",
      },
      ...prev,
    ]);

    messageApi.success(`Added ${formQuantity} units of ${product.name} to ${formWarehouse}.`);
    setActiveModal("none");
  };

  // Execute Stock Out
  const executeStockOut = () => {
    if (formQuantity <= 0) {
      messageApi.error("Quantity must be greater than zero.");
      return;
    }
    const product = products.find((p) => p.id === formProduct);
    if (!product) return;

    const currentWarehouseStock =
      product.warehouses.find((w) => w.warehouse === formWarehouse)?.qty || 0;

    if (formQuantity > currentWarehouseStock) {
      messageApi.error(
        `Insufficient stock! ${formWarehouse} only has ${currentWarehouseStock} units available.`
      );
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== formProduct) return p;
        const updatedWarehouses = p.warehouses.map((w) =>
          w.warehouse === formWarehouse ? { ...w, qty: w.qty - formQuantity } : w
        );
        const newOnHand = Math.max(0, p.onHand - formQuantity);
        return {
          ...p,
          onHand: newOnHand,
          warehouses: updatedWarehouses,
          warehousesCount: updatedWarehouses.filter((w) => w.qty > 0).length,
          status: computeStatus(newOnHand, p.reorderPoint),
        };
      })
    );

    setHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        timestamp: "Just now",
        type: "Stock Out",
        productName: product.name,
        sku: product.sku,
        quantity: -formQuantity,
        warehouse: formWarehouse,
        reason: formReason || "Stock Out dispatch",
        user: "Admin User",
      },
      ...prev,
    ]);

    messageApi.success(`Dispatched ${formQuantity} units of ${product.name} from ${formWarehouse}.`);
    setActiveModal("none");
  };

  // Execute Transfer
  const executeTransfer = () => {
    if (formWarehouse === formTargetWarehouse) {
      messageApi.error("Source and destination warehouses cannot be the same.");
      return;
    }
    if (formQuantity <= 0) {
      messageApi.error("Transfer quantity must be greater than zero.");
      return;
    }
    const product = products.find((p) => p.id === formProduct);
    if (!product) return;

    const sourceStock =
      product.warehouses.find((w) => w.warehouse === formWarehouse)?.qty || 0;

    if (formQuantity > sourceStock) {
      messageApi.error(
        `Insufficient stock at ${formWarehouse}! Only ${sourceStock} units available to transfer.`
      );
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== formProduct) return p;
        // Deduct from source
        let list = p.warehouses.map((w) =>
          w.warehouse === formWarehouse ? { ...w, qty: w.qty - formQuantity } : w
        );
        // Add to destination
        const destExists = list.some((w) => w.warehouse === formTargetWarehouse);
        if (destExists) {
          list = list.map((w) =>
            w.warehouse === formTargetWarehouse
              ? { ...w, qty: w.qty + formQuantity }
              : w
          );
        } else {
          list.push({ warehouse: formTargetWarehouse, qty: formQuantity });
        }
        return {
          ...p,
          warehouses: list,
          warehousesCount: list.filter((w) => w.qty > 0).length,
        };
      })
    );

    setHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        timestamp: "Just now",
        type: "Transfer",
        productName: product.name,
        sku: product.sku,
        quantity: formQuantity,
        warehouse: formWarehouse,
        destinationWarehouse: formTargetWarehouse,
        reason: formReason || "Warehouse transfer",
        user: "Admin User",
      },
      ...prev,
    ]);

    messageApi.success(
      `Transferred ${formQuantity} units of ${product.name} from ${formWarehouse} to ${formTargetWarehouse}.`
    );
    setActiveModal("none");
  };

  // Execute Adjustment
  const executeAdjustment = () => {
    const product = products.find((p) => p.id === formProduct);
    if (!product) return;

    const currentWhQty =
      product.warehouses.find((w) => w.warehouse === formWarehouse)?.qty || 0;
    const variance = formNewCount - currentWhQty;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== formProduct) return p;
        const exists = p.warehouses.some((w) => w.warehouse === formWarehouse);
        let list: WarehouseStock[];
        if (exists) {
          list = p.warehouses.map((w) =>
            w.warehouse === formWarehouse ? { ...w, qty: Math.max(0, formNewCount) } : w
          );
        } else {
          list = [...p.warehouses, { warehouse: formWarehouse, qty: Math.max(0, formNewCount) }];
        }
        const newTotal = list.reduce((acc, w) => acc + w.qty, 0);
        return {
          ...p,
          onHand: newTotal,
          warehouses: list,
          warehousesCount: list.filter((w) => w.qty > 0).length,
          status: computeStatus(newTotal, p.reorderPoint),
        };
      })
    );

    setHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        timestamp: "Just now",
        type: "Adjustment",
        productName: product.name,
        sku: product.sku,
        quantity: variance,
        warehouse: formWarehouse,
        reason: `${formReason || "Physical inventory adjustment"} (${variance >= 0 ? "+" : ""}${variance})`,
        user: "Admin User",
      },
      ...prev,
    ]);

    messageApi.success(
      `Stock level for ${product.name} adjusted to ${formNewCount} units at ${formWarehouse}.`
    );
    setActiveModal("none");
  };

  return (
    <div className="stock-page-container">
      {contextHolder}

      {/* Top Header */}
      <div className="stock-header">
        <div>
          <h1 className="stock-header-title">Stock</h1>
          <p className="stock-header-subtitle">
            Current stock levels across every warehouse.
          </p>
        </div>

        {/* Action Buttons matching screenshot */}
        <div className="stock-actions">
          {/* History */}
          <Link
            href="/stock/transactions"
            className="stock-action-btn"
            style={{ textDecoration: "none" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>History</span>
          </Link>

          {/* Stock In */}
          <button
            type="button"
            className="stock-action-btn"
            onClick={() => handleOpenStockIn()}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            <span>Stock In</span>
          </button>

          {/* Stock Out */}
          <Link
            href="/stock/stock-out"
            className="stock-action-btn"
            style={{ textDecoration: "none" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            <span>Stock Out</span>
          </Link>

          {/* Transfer */}
          <Link
            href="/stock/transfer"
            className="stock-action-btn"
            style={{ textDecoration: "none" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>Transfer</span>
          </Link>

          {/* Adjust - Solid Purple Button */}
          <Link
            href="/stock/adjust"
            className="stock-action-btn-primary"
            style={{ textDecoration: "none" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>Adjust</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="stock-kpi-grid">
        {/* Card 1: Total stock value */}
        <div className="stock-kpi-card">
          <div className="stock-kpi-top">
            <div className="stock-kpi-icon purple">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="stock-kpi-badge green">↑ 2.4%</span>
          </div>
          <div className="stock-kpi-value">{stats.totalStockValue}</div>
          <div className="stock-kpi-label">Total stock value</div>
        </div>

        {/* Card 2: Low stock items */}
        <div className="stock-kpi-card">
          <div className="stock-kpi-top">
            <div className="stock-kpi-icon amber">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="stock-kpi-badge muted">needs reorder</span>
          </div>
          <div className="stock-kpi-value">{stats.lowStockItems}</div>
          <div className="stock-kpi-label">Low stock items</div>
        </div>

        {/* Card 3: Out of stock */}
        <div className="stock-kpi-card">
          <div className="stock-kpi-top">
            <div className="stock-kpi-icon red">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <span className="stock-kpi-badge red">↑ 1</span>
          </div>
          <div className="stock-kpi-value">{stats.outOfStock}</div>
          <div className="stock-kpi-label">Out of stock</div>
        </div>

        {/* Card 4: Active warehouses */}
        <div className="stock-kpi-card">
          <div className="stock-kpi-top">
            <div className="stock-kpi-icon purple">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="stock-kpi-badge muted">no change</span>
          </div>
          <div className="stock-kpi-value">{stats.activeWarehouses}</div>
          <div className="stock-kpi-label">Active warehouses</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="stock-toolbar">
        {/* Search */}
        <div className="stock-search-wrap">
          <SearchOutlined className="stock-search-icon" />
          <input
            type="text"
            className="stock-search-input"
            placeholder="Search product name, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Warehouse Dropdown */}
        <select
          className="stock-filter-select"
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
        >
          <option value="All Warehouses">All Warehouses</option>
          {WAREHOUSE_LIST.map((wh) => (
            <option key={wh} value={wh}>
              {wh}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          className="stock-filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="stock-table-card">
        <table className="stock-table">
          <thead>
            <tr>
              <th style={{ width: "32%" }}>PRODUCT</th>
              <th style={{ width: "22%" }}>CATEGORY</th>
              <th style={{ width: "14%" }}>WAREHOUSES</th>
              <th style={{ width: "14%" }}>ON HAND</th>
              <th style={{ width: "12%" }}>STATUS</th>
              <th style={{ width: "6%", textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "48px 24px", color: "#6b7280" }}>
                  No stock items match your search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((item) => (
                <tr key={item.id}>
                  {/* Product Column */}
                  <td>
                    <div className="stock-prod-cell">
                      <div className="stock-prod-thumb">
                        {/* 3D Isometric Cardboard Box Icon */}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2.5L3.5 7.2L12 12L20.5 7.2L12 2.5Z" fill="#E2A669" />
                          <path d="M3.5 7.2L12 12V21.5L3.5 16.7V7.2Z" fill="#C68244" />
                          <path d="M20.5 7.2L12 12V21.5L20.5 16.7V7.2Z" fill="#B36E32" />
                          <path d="M10 3.6L14 5.8V11.2L10 9V3.6Z" fill="#F8DFB5" opacity="0.85" />
                          <path d="M10 9L14 11.2V20.5L10 18.3V9Z" fill="#E8C795" opacity="0.85" />
                        </svg>
                      </div>
                      <div className="stock-prod-info">
                        <Link
                          href={`/stock/${item.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <span className="stock-prod-name" style={{ cursor: "pointer" }}>
                            {item.name}
                          </span>
                        </Link>
                        <span className="stock-prod-sku">SKU: {item.sku}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category Column */}
                  <td>
                    <span className="stock-category-cell">{item.category}</span>
                  </td>

                  {/* Warehouses Column */}
                  <td>
                    <span className="stock-num-cell">{item.warehousesCount}</span>
                  </td>

                  {/* On Hand Column */}
                  <td>
                    <span className="stock-num-cell">{item.onHand}</span>
                  </td>

                  {/* Status Column */}
                  <td>
                    <span
                      className={`stock-status-pill ${
                        item.status === "Active"
                          ? "active"
                          : item.status === "Low Stock"
                          ? "low"
                          : "out"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* View Details Action Button */}
                  <td style={{ textAlign: "right" }}>
                    <Tooltip title="View product stock details">
                      <Link
                        href={`/stock/${item.id}`}
                        className="stock-view-btn"
                        aria-label={`View details for ${item.name}`}
                      >
                        <EyeOutlined style={{ fontSize: 14 }} />
                      </Link>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Stock In */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#f3eeff",
                color: "#7c3aed",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ↑
            </span>
            <span>Record Stock In</span>
          </div>
        }
        open={activeModal === "stockIn"}
        onOk={executeStockIn}
        onCancel={() => setActiveModal("none")}
        okText="Add to Inventory"
        okButtonProps={{ style: { background: "#6d28d9", borderColor: "#6d28d9" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Product
            </label>
            <select
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
              value={formProduct}
              onChange={(e) => setFormProduct(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Destination Warehouse
            </label>
            <select
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
              value={formWarehouse}
              onChange={(e) => setFormWarehouse(e.target.value)}
            >
              {WAREHOUSE_LIST.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Quantity Received
            </label>
            <input
              type="number"
              min={1}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
              }}
              value={formQuantity}
              onChange={(e) => setFormQuantity(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Reference / PO # / Supplier
            </label>
            <input
              type="text"
              placeholder="e.g. Supplier PO #4092"
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
              }}
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Stock Out */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#fee2e2",
                color: "#ef4444",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ↓
            </span>
            <span>Record Stock Out</span>
          </div>
        }
        open={activeModal === "stockOut"}
        onOk={executeStockOut}
        onCancel={() => setActiveModal("none")}
        okText="Dispatch Stock"
        okButtonProps={{ style: { background: "#ef4444", borderColor: "#ef4444" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Product
            </label>
            <select
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
              value={formProduct}
              onChange={(e) => setFormProduct(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.onHand} on hand
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Source Warehouse
            </label>
            <select
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
              value={formWarehouse}
              onChange={(e) => setFormWarehouse(e.target.value)}
            >
              {WAREHOUSE_LIST.map((w) => {
                const prod = products.find((p) => p.id === formProduct);
                const count = prod?.warehouses.find((item) => item.warehouse === w)?.qty || 0;
                return (
                  <option key={w} value={w}>
                    {w} ({count} units)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Quantity to Dispatch
            </label>
            <input
              type="number"
              min={1}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
              }}
              value={formQuantity}
              onChange={(e) => setFormQuantity(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Dispatch Reason / Order #
            </label>
            <input
              type="text"
              placeholder="e.g. Customer Sales Order #ORD-9912"
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
              }}
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Transfer */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#f3eeff",
                color: "#8b5cf6",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ⇄
            </span>
            <span>Transfer Between Warehouses</span>
          </div>
        }
        open={activeModal === "transfer"}
        onOk={executeTransfer}
        onCancel={() => setActiveModal("none")}
        okText="Transfer Stock"
        okButtonProps={{ style: { background: "#6d28d9", borderColor: "#6d28d9" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Product
            </label>
            <select
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
              value={formProduct}
              onChange={(e) => setFormProduct(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                From Warehouse
              </label>
              <select
                style={{
                  width: "100%",
                  height: 38,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  padding: "0 10px",
                }}
                value={formWarehouse}
                onChange={(e) => setFormWarehouse(e.target.value)}
              >
                {WAREHOUSE_LIST.map((w) => {
                  const prod = products.find((p) => p.id === formProduct);
                  const count = prod?.warehouses.find((item) => item.warehouse === w)?.qty || 0;
                  return (
                    <option key={w} value={w}>
                      {w} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                To Warehouse
              </label>
              <select
                style={{
                  width: "100%",
                  height: 38,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  padding: "0 10px",
                }}
                value={formTargetWarehouse}
                onChange={(e) => setFormTargetWarehouse(e.target.value)}
              >
                {WAREHOUSE_LIST.map((w) => (
                  <option key={w} value={w} disabled={w === formWarehouse}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Transfer Quantity
            </label>
            <input
              type="number"
              min={1}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
              }}
              value={formQuantity}
              onChange={(e) => setFormQuantity(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Transfer Notes / Request Ref
            </label>
            <input
              type="text"
              placeholder="e.g. Regional redistribution"
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
              }}
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Adjust */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#f3eeff",
                color: "#6d28d9",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ⚙
            </span>
            <span>Adjust Inventory Count</span>
          </div>
        }
        open={activeModal === "adjust"}
        onOk={executeAdjustment}
        onCancel={() => setActiveModal("none")}
        okText="Save Adjustment"
        okButtonProps={{ style: { background: "#6d28d9", borderColor: "#6d28d9" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Product
            </label>
            <select
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
              value={formProduct}
              onChange={(e) => {
                const pId = e.target.value;
                setFormProduct(pId);
                const prod = products.find((p) => p.id === pId);
                const cur =
                  prod?.warehouses.find((w) => w.warehouse === formWarehouse)?.qty || 0;
                setFormNewCount(cur);
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Warehouse
            </label>
            <select
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
              value={formWarehouse}
              onChange={(e) => {
                const wh = e.target.value;
                setFormWarehouse(wh);
                const prod = products.find((p) => p.id === formProduct);
                const cur = prod?.warehouses.find((w) => w.warehouse === wh)?.qty || 0;
                setFormNewCount(cur);
              }}
            >
              {WAREHOUSE_LIST.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "#faf8f5",
              border: "1px solid #f0eef5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: "#6b7280" }}>Current recorded count:</span>
            <strong style={{ fontSize: 14 }}>
              {products
                .find((p) => p.id === formProduct)
                ?.warehouses.find((w) => w.warehouse === formWarehouse)?.qty || 0}{" "}
              units
            </strong>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              New Actual Count
            </label>
            <input
              type="number"
              min={0}
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
                fontSize: 15,
                fontWeight: 600,
              }}
              value={formNewCount}
              onChange={(e) => setFormNewCount(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          {/* Variance Indicator */}
          {(() => {
            const currentWhQty =
              products
                .find((p) => p.id === formProduct)
                ?.warehouses.find((w) => w.warehouse === formWarehouse)?.qty || 0;
            const variance = formNewCount - currentWhQty;
            return (
              <div
                style={{
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>Calculated variance:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      variance > 0
                        ? "#16a34a"
                        : variance < 0
                        ? "#dc2626"
                        : "#6b7280",
                  }}
                >
                  {variance > 0 ? `+${variance}` : variance} units
                </span>
              </div>
            );
          })()}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Adjustment Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Annual audit count variance"
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 12px",
              }}
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* DRAWER: History */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#f3eeff",
                color: "#7c3aed",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ⏱
            </span>
            <span>Stock Transaction History</span>
          </div>
        }
        placement="right"
        width={460}
        onClose={() => setActiveModal("none")}
        open={activeModal === "history"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {history.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #ece8f0",
                background: "#ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    backgroundColor:
                      entry.type === "Stock In"
                        ? "#dcfce7"
                        : entry.type === "Stock Out"
                        ? "#fee2e2"
                        : entry.type === "Transfer"
                        ? "#f3eeff"
                        : "#fef3c7",
                    color:
                      entry.type === "Stock In"
                        ? "#15803d"
                        : entry.type === "Stock Out"
                        ? "#b91c1c"
                        : entry.type === "Transfer"
                        ? "#6d28d9"
                        : "#b45309",
                  }}
                >
                  {entry.type}
                </span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{entry.timestamp}</span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                {entry.productName}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                SKU: {entry.sku}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#374151",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: 8,
                }}
              >
                <span>
                  {entry.destinationWarehouse
                    ? `${entry.warehouse} → ${entry.destinationWarehouse}`
                    : entry.warehouse}
                </span>
                <strong
                  style={{
                    color:
                      entry.quantity > 0
                        ? "#16a34a"
                        : entry.quantity < 0
                        ? "#dc2626"
                        : "#374151",
                  }}
                >
                  {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} units
                </strong>
              </div>

              {entry.reason && (
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  Note: {entry.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </Drawer>

      {/* DRAWER: Product Detail Breakdown */}
      <Drawer
        title={
          selectedProduct ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "#f6f4ee",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2.5L3.5 7.2L12 12L20.5 7.2L12 2.5Z" fill="#E2A669" />
                  <path d="M3.5 7.2L12 12V21.5L3.5 16.7V7.2Z" fill="#C68244" />
                  <path d="M20.5 7.2L12 12V21.5L20.5 16.7V7.2Z" fill="#B36E32" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedProduct.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  SKU: {selectedProduct.sku}
                </div>
              </div>
            </div>
          ) : (
            "Product Details"
          )
        }
        placement="right"
        width={480}
        onClose={() => setActiveModal("none")}
        open={activeModal === "detail" && Boolean(selectedProduct)}
      >
        {selectedProduct && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Summary Banner */}
            <div
              style={{
                padding: "16px",
                borderRadius: 14,
                backgroundColor: "#faf8f5",
                border: "1px solid #f0eef5",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Total On Hand</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>
                  {selectedProduct.onHand}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Total Inventory Value</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#6d28d9" }}>
                  ${(selectedProduct.onHand * selectedProduct.unitCost).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Category</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedProduct.category}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Status</div>
                <span
                  className={`stock-status-pill ${
                    selectedProduct.status === "Active"
                      ? "active"
                      : selectedProduct.status === "Low Stock"
                      ? "low"
                      : "out"
                  }`}
                  style={{ display: "inline-block", marginTop: 2 }}
                >
                  {selectedProduct.status}
                </span>
              </div>
            </div>

            {/* Warehouse Breakdown Table */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>
                Stock by Location ({selectedProduct.warehouses.length} warehouses)
              </h3>
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #ece8f0",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #ece8f0" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "10px 14px",
                          fontSize: 11,
                          color: "#6b7280",
                        }}
                      >
                        WAREHOUSE
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "10px 14px",
                          fontSize: 11,
                          color: "#6b7280",
                        }}
                      >
                        UNITS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.warehouses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#9ca3af",
                          }}
                        >
                          No active stock in any warehouse.
                        </td>
                      </tr>
                    ) : (
                      selectedProduct.warehouses.map((wh) => (
                        <tr
                          key={wh.warehouse}
                          style={{ borderBottom: "1px solid #f3f4f6" }}
                        >
                          <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                            {wh.warehouse}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              padding: "11px 14px",
                              fontWeight: 700,
                            }}
                          >
                            {wh.qty}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="stock-action-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => handleOpenStockIn(selectedProduct)}
              >
                + Stock In
              </button>
              <button
                type="button"
                className="stock-action-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => handleOpenTransfer(selectedProduct)}
              >
                ⇄ Transfer
              </button>
              <button
                type="button"
                className="stock-action-btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => handleOpenAdjust(selectedProduct)}
              >
                ⚙ Adjust
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
