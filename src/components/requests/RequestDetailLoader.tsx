"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequestDetailPage from "@/components/requests/RequestDetailPage";
import { errorText } from "@/components/common/live-state";
import { fetchRequest, type LiveRequest } from "@/features/requests/requests-live";

import { markSeen } from "@/features/seen/seen-store";
export default function RequestDetailLoader({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<LiveRequest | null>(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setRequest(await fetchRequest(requestId));
      markSeen("requests", [requestId]);
    } catch (loadError) {
      if ((loadError as { status?: number }).status === 404) setNotFound(true);
      else setError(errorText(loadError, "Could not load this request."));
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (notFound) {
    return (
      <main className="request-detail-message">
        <p>Request not found.</p>
        <Link href="/requests">Back to requests</Link>
      </main>
    );
  }
  if (error) {
    return (
      <main className="request-detail-message" role="alert">
        <p>{error}</p>
        <button type="button" className="stock-action-btn" onClick={load}>
          Try again
        </button>
      </main>
    );
  }
  if (!request) {
    return <main className="request-detail-message">Loading request…</main>;
  }
  return <RequestDetailPage request={request} onChanged={load} />;
}
