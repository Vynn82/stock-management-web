import { create } from "zustand";
import { demoProducts, Product } from "@/types/inventory";

interface ProductsState {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (key: string, patch: Partial<Product>) => void;
  deleteProduct: (key: string) => void;
  resetDemoProducts: () => void;
}

const STORAGE_KEY = "stockflow_products_v1";

function loadInitialProducts(): Product[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return demoProducts;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: demoProducts,
  addProduct: (product: Product) => {
    set((state) => {
      const updated = [product, ...state.products];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore storage error
        }
      }
      return { products: updated };
    });
  },
  updateProduct: (key: string, patch: Partial<Product>) => {
    set((state) => {
      const updated = state.products.map((p) =>
        p.key === key ? { ...p, ...patch } : p,
      );
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return { products: updated };
    });
  },
  deleteProduct: (key: string) => {
    set((state) => {
      const updated = state.products.filter((p) => p.key !== key);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return { products: updated };
    });
  },
  resetDemoProducts: () => {
    set({ products: demoProducts });
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  },
}));
