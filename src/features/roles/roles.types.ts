import { BaseEntity } from "@/types/common";

export interface Role extends BaseEntity, Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}
