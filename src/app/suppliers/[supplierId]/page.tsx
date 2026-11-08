"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SupplierDetailsPage from "@/components/suppliers/SupplierDetailsPage";
import { errorText } from "@/components/common/live-state";
import { fetchSupplierOrders, suppliersApi, type SupplierOrder, type SupplierRow } from "@/features/live/master-data";
import BackButton from "@/components/ui/BackButton";

export default function SupplierDetailsRoute() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const [supplier, setSupplier] = useState<SupplierRow | null>(null);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const found = await suppliersApi.get(supplierId);
      setSupplier(found);
      // Order history is optional: a missing permission shouldn't hide the supplier.
      setOrders(await fetchSupplierOrders(found.code).catch(() => []));
    } catch (e) {
      if ((e as { status?: number }).status === 404) setNotFound(true);
      else setError(errorText(e, "Could not load supplier details."));
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="supplier-detail-message" aria-live="polite">Loading supplier details...</div>;
  if (error) return (
    <div className="supplier-detail-message" role="alert">
      <p>{error}</p>
      <button type="button" className="stock-action-btn" onClick={load}>Try again</button>
    </div>
  );
  if (notFound || !supplier) return (
    <div className="supplier-detail-message">
      <p>Supplier not found.</p>
      <BackButton href="/manage/suppliers" />
    </div>
  );
  return <SupplierDetailsPage supplier={supplier} orders={orders} />;
}
