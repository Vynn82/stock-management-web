export interface MenuItem {
  id?: string;
  name: string;
  label: string;
  path?: string;
  icon?: string;
  parentId?: string | null;
  sortOrder?: number;
}

export interface CreateMenuItemInput {
  name: string;
  label: string;
  path?: string;
  icon?: string;
  parentId?: string | null;
  sortOrder?: number;
}
