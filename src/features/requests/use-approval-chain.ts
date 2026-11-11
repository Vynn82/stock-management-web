"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchApproverCandidates, type ApproverCandidate } from "@/features/requests/requests-live";

export type SignoffRole = "CERTIFIER" | "APPROVER";

export interface ChainRow {
  reviewerId: string;
  role: SignoffRole;
}

export interface ApproverOption {
  id: string;
  label: string;
}

/**
 * Who may be picked as an Approver, by the requester's own role (same rule as the mobile
 * Add Product form): Admin -> Super Admin, Manager -> Admin / Super Admin, Staff -> Manager
 * and above. `null` = no restriction (Super Admin, or the stock forms).
 */
export function approverRolesFor(roles: string[]): Set<string> | null {
  if (roles.includes("SUPER_ADMIN")) return null;
  if (roles.includes("ADMIN")) return new Set(["SUPER_ADMIN"]);
  if (roles.includes("MANAGER")) return new Set(["ADMIN", "SUPER_ADMIN"]);
  return new Set(["MANAGER", "ADMIN", "SUPER_ADMIN"]);
}

const APPROVER: SignoffRole = "APPROVER";

/**
 * The approval chain a requester builds for a request ("Approvers & Verification").
 * Mirrors the mobile ApprovalChain: starts with one Approver row, a person can be
 * used once, and the last step must be an Approver.
 */
export function useApprovalChain(enabled: boolean, opts: { restrictApprovers?: boolean } = {}) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<ApproverCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [rows, setRows] = useState<ChainRow[]>([{ reviewerId: "", role: APPROVER }]);

  const roleKey = (user?.roles ?? (user?.role ? [user.role] : [])).join(",");
  const approverRoles = useMemo(
    () => (opts.restrictApprovers ? approverRolesFor(roleKey ? roleKey.split(",") : []) : null),
    [opts.restrictApprovers, roleKey],
  );

  const mayApprove = useCallback(
    (c: ApproverCandidate) => c.canApprove && (approverRoles === null || c.roles.some((r) => approverRoles.has(r))),
    [approverRoles],
  );

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setCandidates(await fetchApproverCandidates());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load the people to choose from.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void loadCandidates();
  }, [enabled, loadCandidates]);

  const addRow = () => setRows((cur) => [...cur, { reviewerId: "", role: APPROVER }]);
  const removeRow = (index: number) => setRows((cur) => (cur.length > 1 ? cur.filter((_, i) => i !== index) : cur));
  const setReviewer = (index: number, reviewerId: string) =>
    setRows((cur) => cur.map((r, i) => (i === index ? { ...r, reviewerId } : r)));
  const setRole = (index: number, role: SignoffRole) =>
    setRows((cur) =>
      cur.map((r, i) => {
        if (i !== index) return r;
        // Switching to Approver: a reviewer who may not approve has to be picked again.
        const candidate = candidates.find((c) => c.id === r.reviewerId);
        const keep = role !== APPROVER || !candidate || mayApprove(candidate);
        return { reviewerId: keep ? r.reviewerId : "", role };
      }),
    );

  /** People shown in row `index`: nobody already used in another row; Approvers only if allowed. */
  const reviewerOptionsFor = (index: number): ApproverOption[] => {
    const row = rows[index];
    if (!row) return [];
    const used = new Set(rows.filter((_, i) => i !== index).map((r) => r.reviewerId).filter(Boolean));
    return candidates
      .filter((c) => !used.has(c.id) && (row.role !== APPROVER || mayApprove(c)))
      .map((c) => ({ id: c.id, label: c.roles.length ? `${c.name} (${c.roles.join(", ")})` : c.name }));
  };

  /** Rules the server also enforces, caught next to the form. `null` when fine. */
  const validate = (): string | null => {
    if (rows.length === 0) return "Add at least one approver";
    const missing = rows.findIndex((r) => !r.reviewerId);
    if (missing !== -1) return `Choose a staff reviewer for Step ${missing + 1}`;
    if (rows[rows.length - 1].role !== APPROVER) return "The last step must be an Approver (Admin or Manager)";
    return null;
  };

  /** `[{userId, actionType}]` in step order, as `POST /requests` expects. */
  const payload = () => rows.map((r) => ({ userId: r.reviewerId, actionType: r.role }));

  return { rows, loading, loadError, addRow, removeRow, setReviewer, setRole, reviewerOptionsFor, validate, payload, reload: loadCandidates };
}

export type ApprovalChainState = ReturnType<typeof useApprovalChain>;
