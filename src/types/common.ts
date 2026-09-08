export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StatusType = "active" | "inactive" | "pending" | "archived";

export interface OptionItem<T = string> {
  label: string;
  value: T;
}
