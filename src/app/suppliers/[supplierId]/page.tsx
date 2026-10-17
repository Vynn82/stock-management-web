"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SupplierDetailsPage from "@/components/suppliers/SupplierDetailsPage";
import { getSupplier, readCustomSuppliers, type Supplier } from "@/components/suppliers/supplier-data";

export default function SupplierDetailsRoute() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setSupplier(getSupplier(supplierId) ?? readCustomSuppliers().find((item) => item.id === Number(supplierId)) ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load supplier details.");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  if (error) return <div className="supplier-detail-message" role="alert">{error}</div>;
  if (loading) return <div className="supplier-detail-message" aria-live="polite">Loading supplier details...</div>;
  if (!supplier) return <div className="supplier-detail-message">
    <p>Supplier not found.</p>
    <Link href="/manage/suppliers">Back to suppliers</Link>
  </div>;
  return <SupplierDetailsPage supplier={supplier} />;
}
