"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequestDetailPage from "@/components/requests/RequestDetailPage";
import { initialRequests, loadAddedRequests, type StockRequest } from "@/components/requests/request-data";

export default function RequestDetailLoader({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<StockRequest | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const found = [...initialRequests, ...loadAddedRequests()].find((item) => item.id === requestId);
      setRequest(found ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this request.");
    }
  }, [requestId]);

  if (error) {
    return <main className="request-detail-message" role="alert">{error}</main>;
  }
  if (!request) {
    return <main className="request-detail-message">Loading request…</main>;
  }
  return <RequestDetailPage request={request} />;
}
