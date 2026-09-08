"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { ProductForm } from "./product-form";
import { CreateProductInput } from "../products.types";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  title?: string;
  initialValues?: Partial<CreateProductInput>;
}

export function ProductDialog({
  isOpen,
  onClose,
  onSubmit,
  title = "Add Product",
  initialValues,
}: ProductDialogProps) {
  async function handleFormSubmit(data: CreateProductInput) {
    await onSubmit(data);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <ProductForm initialValues={initialValues} onSubmit={handleFormSubmit} />
    </Modal>
  );
}
