"use client";

import { useState } from "react";
import { Button, Input, Modal, Popconfirm, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

type Category = {
  id: number;
  name: string;
  itemCount: number;
  color: string;
};

const initialCategories: Category[] = [
  { id: 1, name: "Electronics", itemCount: 312, color: "#6d28d9" },
  { id: 2, name: "Office", itemCount: 184, color: "#16a34a" },
  { id: 3, name: "Furniture", itemCount: 67, color: "#c25a08" },
  { id: 4, name: "Cables & Adapters", itemCount: 241, color: "#5794f5" },
  { id: 5, name: "Packaging", itemCount: 98, color: "#e4232d" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setModalOpen(true);
  };

  const saveCategory = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      messageApi.error("Enter a category name.");
      return;
    }
    if (categories.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase() && category.id !== editingCategory?.id)) {
      messageApi.error("A category with this name already exists.");
      return;
    }
    if (editingCategory) {
      setCategories((current) => current.map((category) => category.id === editingCategory.id ? { ...category, name: trimmedName } : category));
    } else {
      setCategories((current) => [...current, { id: Date.now(), name: trimmedName, itemCount: 0, color: "#6d28d9" }]);
    }
    setModalOpen(false);
  };

  const deleteCategory = (id: number) => {
    setCategories((current) => current.filter((category) => category.id !== id));
  };

  return <div className="manage-categories-page">
    {contextHolder}
    <div className="manage-categories-heading">
      <h1>Categories</h1>
      <Button className="manage-add-category" type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Category</Button>
    </div>
    <div className="category-card-grid">
      {categories.map((category) => <article className="category-card" key={category.id}>
        <span className="category-color-dot" style={{ backgroundColor: category.color }} />
        <strong className="category-name">{category.name}</strong>
        <span className="category-item-count">{category.itemCount} items</span>
        <div className="category-card-actions">
          <button type="button" aria-label={`Edit ${category.name}`} onClick={() => openEdit(category)}><EditOutlined /></button>
          <Popconfirm
            title="Delete category?"
            description={`Delete ${category.name}?`}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteCategory(category.id)}
          >
            <button type="button" className="category-delete-action" aria-label={`Delete ${category.name}`}><DeleteOutlined /></button>
          </Popconfirm>
        </div>
      </article>)}
    </div>
    <Modal
      title={editingCategory ? "Edit category" : "Add category"}
      open={modalOpen}
      onOk={saveCategory}
      onCancel={() => setModalOpen(false)}
      okText={editingCategory ? "Save changes" : "Add category"}
      destroyOnHidden
    >
      <label className="category-modal-label" htmlFor="category-name">Category name</label>
      <Input id="category-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} onPressEnter={saveCategory} placeholder="e.g. Electronics" />
    </Modal>
  </div>;
}
