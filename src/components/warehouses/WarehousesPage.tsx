"use client";

import { useState } from "react";
import { Button, Input, Modal, message } from "antd";
import { HomeOutlined, PlusOutlined } from "@ant-design/icons";

type Warehouse = {
  id: number;
  name: string;
  address: string;
  capacity: number;
  items: number;
  manager: string;
};

const initialWarehouses: Warehouse[] = [
  { id: 1, name: "Phnom Penh Main Warehouse", address: "St. 598, Phnom Penh", capacity: 82, items: 1284, manager: "Sokha Chan" },
  { id: 2, name: "Siem Reap Branch Warehouse", address: "National Road 6, Siem Reap", capacity: 45, items: 512, manager: "Dara Pich" },
  { id: 3, name: "Battambang Warehouse", address: "Route 5, Battambang", capacity: 93, items: 347, manager: "Vanna Roeun" },
  { id: 4, name: "Kampong Cham Warehouse", address: "Preah Monivong Blvd, Kampong Cham", capacity: 60, items: 296, manager: "Leakena Sam" },
];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [manager, setManager] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const addWarehouse = () => {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedManager = manager.trim();
    if (!trimmedName || !trimmedAddress || !trimmedManager) {
      messageApi.error("Enter the warehouse name, location, and manager.");
      return;
    }
    if (warehouses.some((warehouse) => warehouse.name.toLowerCase() === trimmedName.toLowerCase())) {
      messageApi.error("A warehouse with this name already exists.");
      return;
    }

    setWarehouses((current) => [...current, {
      id: Date.now(),
      name: trimmedName,
      address: trimmedAddress,
      manager: trimmedManager,
      capacity: 0,
      items: 0,
    }]);
    setModalOpen(false);
    setName("");
    setAddress("");
    setManager("");
  };

  return <div className="manage-warehouses-page">
    {contextHolder}
    <div className="manage-warehouses-heading">
      <h1>Warehouses</h1>
      <Button className="manage-add-category" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add Warehouse</Button>
    </div>
    <div className="warehouse-card-grid">
      {warehouses.map((warehouse) => {
        const capacityColor = warehouse.capacity >= 90 ? "high" : warehouse.capacity >= 70 ? "medium" : "normal";
        return <article className="warehouse-card" key={warehouse.id}>
          <div className="warehouse-card-heading">
            <span className="warehouse-icon"><HomeOutlined /></span>
            <div className="warehouse-title-copy">
              <h2>{warehouse.name}</h2>
              <p>{warehouse.address}</p>
            </div>
          </div>
          <div className="warehouse-capacity">
            <div className="warehouse-capacity-label">
              <span>Capacity used</span>
              <strong className={`warehouse-capacity-value ${capacityColor}`}>{warehouse.capacity}%</strong>
            </div>
            <div className="warehouse-capacity-track" role="progressbar" aria-label={`${warehouse.name} capacity used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={warehouse.capacity}>
              <span className={capacityColor} style={{ width: `${warehouse.capacity}%` }} />
            </div>
          </div>
          <div className="warehouse-card-stats">
            <div className="warehouse-items">
              <span>Items</span>
              <strong>{warehouse.items.toLocaleString("en-US")}</strong>
            </div>
            <div className="warehouse-manager">
              <span>Manager</span>
              <div>
                <strong>{warehouse.manager}</strong>
                <span className="warehouse-manager-avatar" aria-hidden="true">{warehouse.manager.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </article>;
      })}
    </div>
    <Modal
      title="Add warehouse"
      open={modalOpen}
      onOk={addWarehouse}
      onCancel={() => setModalOpen(false)}
      okText="Add warehouse"
      destroyOnHidden
    >
      <div className="warehouse-modal-fields">
        <label htmlFor="warehouse-name">Warehouse name</label>
        <Input id="warehouse-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Phnom Penh Main Warehouse" />
        <label htmlFor="warehouse-address">Address</label>
        <Input id="warehouse-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Warehouse location" />
        <label htmlFor="warehouse-manager">Manager</label>
        <Input id="warehouse-manager" value={manager} onChange={(event) => setManager(event.target.value)} onPressEnter={addWarehouse} placeholder="Manager name" />
      </div>
    </Modal>
  </div>;
}
