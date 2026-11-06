import type { User } from "@/types/auth";
import { hasAnyPermission } from "./permissions";

/**
 * Which backend permission a screen needs. The first matching rule wins, so the
 * more specific paths come first. A path with no rule is open to every signed-in user.
 */
interface Rule {
  test: RegExp;
  any: string[];
  feature: string;
}

const RULES: Rule[] = [
  { test: /^\/products\/[^/]+\/edit/, any: ["PRODUCT_EDIT"], feature: "Edit product" },
  { test: /^\/products\/(create|add)/, any: ["PRODUCT_CREATE"], feature: "Create product" },
  { test: /^\/products/, any: ["PRODUCT_VIEW"], feature: "Products" },
  { test: /^\/stock\/history/, any: ["ADJUSTMENT_VIEW"], feature: "Stock history" },
  { test: /^\/stock\/(.*\/)?transfer/, any: ["STOCK_TRANSFER"], feature: "Stock transfer" },
  { test: /^\/stock\/(.*\/)?(adjust|stock-out|stockout|reconcile)/, any: ["STOCK_ADJUST"], feature: "Stock adjustment" },
  { test: /^\/stock/, any: ["STOCK_VIEW"], feature: "Stock" },
  { test: /^\/purchasing\/[^/]+\/edit/, any: ["PO_CREATE"], feature: "Edit purchase order" },
  { test: /^\/purchasing\/new/, any: ["PO_CREATE"], feature: "Create purchase order" },
  { test: /^\/purchasing\/.*\/receive/, any: ["PO_RECEIVE"], feature: "Receive goods" },
  { test: /^\/purchasing/, any: ["PO_VIEW"], feature: "Purchasing" },
  { test: /^\/requests\/new/, any: ["REQUEST_CREATE"], feature: "New request" },
  { test: /^\/requests/, any: ["REQUEST_VIEW"], feature: "Requests" },
  { test: /^\/reports/, any: ["REPORT_VIEW"], feature: "Reports" },
  { test: /^\/users\/roles/, any: ["ROLE_VIEW"], feature: "Roles & permissions" },
  { test: /^\/users\/invite/, any: ["USER_CREATE"], feature: "Invite member" },
  { test: /^\/users/, any: ["USER_VIEW"], feature: "Users" },
  { test: /^\/manage\/brands/, any: ["BRAND_VIEW", "BRAND_MANAGE"], feature: "Brands" },
  { test: /^\/(manage\/suppliers|suppliers)/, any: ["SUPPLIER_VIEW", "SUPPLIER_MANAGE"], feature: "Suppliers" },
  { test: /^\/(manage\/warehouses|warehouses)/, any: ["WAREHOUSE_VIEW", "WAREHOUSE_MANAGE"], feature: "Warehouses" },
];

export interface AccessCheck {
  allowed: boolean;
  feature: string;
  needs: string[];
}

export function checkAccess(user: User | null, pathname: string): AccessCheck {
  const rule = RULES.find((r) => r.test.test(pathname));
  if (!rule) return { allowed: true, feature: "", needs: [] };
  // Permissions not delivered yet (old session): don't lock the person out, the server still enforces them.
  if (!user || user.permissions === undefined) return { allowed: true, feature: rule.feature, needs: rule.any };
  return { allowed: hasAnyPermission(user, rule.any), feature: rule.feature, needs: rule.any };
}
