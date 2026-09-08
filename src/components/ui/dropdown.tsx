import React from "react";
import { cn } from "@/lib/utils";
import { OptionItem } from "@/types/common";

export interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: OptionItem[];
  error?: string;
}

export const Dropdown = React.forwardRef<HTMLSelectElement, DropdownProps>(
  ({ className, label, options, error, id, ...props }, ref) => {
    return (
      <div className="field">
        {label && (
          <label className="label" htmlFor={id}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn("input", className)}
          style={{ cursor: "pointer", appearance: "auto" }}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{
                background: "var(--bg-card)",
                color: "var(--text-main)",
              }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && <div className="error">{error}</div>}
      </div>
    );
  },
);

Dropdown.displayName = "Dropdown";
