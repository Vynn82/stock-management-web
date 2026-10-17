export type Product = {
  key: string;
  name: string;
  sku: string;
  category: string;
  warehouse: string;
  stock: number;
  reorder: number;
  status: "In stock" | "Low stock" | "Out of stock";
  price: number;
};

export const demoProducts: Product[] = [
  { key: "1", name: "Wireless Headphones", sku: "WH-2048", category: "Electronics", warehouse: "Phnom Penh", stock: 128, reorder: 30, status: "In stock", price: 89 },
  { key: "2", name: "Ergonomic Office Chair", sku: "OC-1102", category: "Furniture", warehouse: "Siem Reap", stock: 18, reorder: 20, status: "Low stock", price: 245 },
  { key: "3", name: "USB-C Charging Hub", sku: "CH-8920", category: "Electronics", warehouse: "Phnom Penh", stock: 0, reorder: 24, status: "Out of stock", price: 36 },
  { key: "4", name: "A5 Hardcover Notebook", sku: "NB-5510", category: "Stationery", warehouse: "Battambang", stock: 342, reorder: 80, status: "In stock", price: 12 },
  { key: "5", name: "Adjustable Desk Lamp", sku: "DL-7781", category: "Furniture", warehouse: "Kampong Cham", stock: 46, reorder: 15, status: "In stock", price: 48 },
];
