"use client";

import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import SearchSelect from "@/components/ui/SearchSelect";
import type { ApprovalChainState, SignoffRole } from "@/features/requests/use-approval-chain";

/** Help text under the title, as on the mobile app. */
export const CHAIN_HELP_STOCK =
  "The stock only changes after the last approver approves. Add a Certifier first if someone has to verify it.";
export const CHAIN_HELP_PRODUCT =
  "The product is created only after the last approver approves. Add a Certifier first if someone has to verify it.";

/** "Approvers & Verification": who must sign off, in order. Same layout as the mobile card. */
export default function ApprovalChainCard({ chain, helpText }: { chain: ApprovalChainState; helpText: string }) {
  return (
    <section className="apc" aria-label="Approvers & Verification">
      <h3 className="apc-title">Approvers &amp; Verification</h3>
      <div className="apc-card">
        <p className="apc-help">{helpText}</p>
        {chain.loadError && (
          <p className="apc-error" role="alert">
            {chain.loadError}{" "}
            <button type="button" className="apc-link" onClick={() => void chain.reload()}>
              Try again
            </button>
          </p>
        )}
        {chain.rows.map((row, index) => (
          <div className="apc-row" key={index}>
            <div className="apc-row-head">
              <strong>Step {index + 1}</strong>
              {chain.rows.length > 1 && (
                <button type="button" className="apc-remove" onClick={() => chain.removeRow(index)} aria-label={`Remove step ${index + 1}`}>
                  <CloseOutlined />
                </button>
              )}
            </div>
            <label className="apc-field">
              <span>Staff Reviewer <b aria-hidden="true">*</b></span>
              <SearchSelect value={row.reviewerId} onChange={(e) => chain.setReviewer(index, e.target.value)} disabled={chain.loading}>
                <option value="">{chain.loading ? "Loading…" : "Choose a person…"}</option>
                {chain.reviewerOptionsFor(index).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SearchSelect>
            </label>
            <label className="apc-field">
              <span>Signoff Role <b aria-hidden="true">*</b></span>
              <SearchSelect value={row.role} onChange={(e) => chain.setRole(index, e.target.value as SignoffRole)}>
                <option value="CERTIFIER">Certifier</option>
                <option value="APPROVER">Approver</option>
              </SearchSelect>
            </label>
          </div>
        ))}
        <button type="button" className="apc-add" onClick={chain.addRow}>
          <PlusOutlined /> Add Approver
        </button>
      </div>
    </section>
  );
}
