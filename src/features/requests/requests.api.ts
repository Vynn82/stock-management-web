import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  InventoryRequest,
  CreateProductRequestInput,
  CommitRequestInput,
} from "./requests.types";

const MOCK_REQUESTS: InventoryRequest[] = [
  {
    id: "717b60c1-d5b4-417b-8f83-dc4777333d3e",
    requestType: "PRODUCT_CREATE",
    status: "PENDING",
    product: {
      productCode: "IP15",
      productName: "iPhone 15",
      categoryCode: "SMARTPHONE",
      brandCode: "APPLE",
      hasVariants: true,
      unit: "PCS",
      productSku: "IP15",
    },
    variants: [
      {
        variantCode: "IP15-BLK-128",
        variantName: "Black / 128GB",
        variantSku: "IP15-BLK-128",
        variantCostPrice: 700,
        variantSellingPrice: 799,
      },
      {
        variantCode: "IP15-BLU-256",
        variantName: "Blue / 256GB",
        variantSku: "IP15-BLU-256",
        variantCostPrice: 780,
        variantSellingPrice: 899,
      },
    ],
    stock: [
      {
        productCode: "IP15",
        variantCode: "IP15-BLK-128",
        warehouseCode: "WH001",
        quantity: 50,
      },
      {
        productCode: "IP15",
        variantCode: "IP15-BLU-256",
        warehouseCode: "WH001",
        quantity: 30,
      },
    ],
    approvers: [
      {
        userId: "693a56ed-5436-4756-ba32-ff09e691fbfd",
        actionType: "CERTIFIER",
        status: "APPROVED",
      },
      {
        userId: "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
        actionType: "APPROVER",
        status: "PENDING",
      },
    ],
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "a3b8c9d0-1234-5678-90ab-cdef12345678",
    requestType: "PRODUCT_CREATE",
    status: "APPROVED",
    product: {
      productCode: "PRD-001",
      productName: "Industrial Thermal Label Printer",
      categoryCode: "HARDWARE",
      brandCode: "ZEBRA",
      hasVariants: false,
      unit: "SET",
      productSku: "PRD-001",
    },
    variants: [
      {
        variantCode: "PRD-001-STD",
        variantName: "Standard",
        variantSku: "PRD-001",
        variantCostPrice: 320,
        variantSellingPrice: 429.99,
      },
    ],
    stock: [
      {
        productCode: "PRD-001",
        variantCode: "PRD-001-STD",
        warehouseCode: "WH001",
        quantity: 18,
      },
    ],
    approvers: [
      {
        userId: "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
        actionType: "APPROVER",
        status: "APPROVED",
      },
    ],
    remark: "Verified serial numbers and warehouse allocation.",
    createdAt: "2026-03-02T14:30:00.000Z",
  },
  {
    id: "f4e5d6c7-9876-5432-10fe-dcba98765432",
    requestType: "PRODUCT_CREATE",
    status: "REJECTED",
    product: {
      productCode: "PRD-002",
      productName: "Handheld 2D Barcode Scanner",
      categoryCode: "HARDWARE",
      brandCode: "HONEYWELL",
      hasVariants: false,
      unit: "PCS",
      productSku: "PRD-002",
    },
    variants: [
      {
        variantCode: "PRD-002-STD",
        variantName: "Standard",
        variantSku: "PRD-002",
        variantCostPrice: 65,
        variantSellingPrice: 89.5,
      },
    ],
    stock: [
      {
        productCode: "PRD-002",
        variantCode: "PRD-002-STD",
        warehouseCode: "WH002",
        quantity: 45,
      },
    ],
    approvers: [
      {
        userId: "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
        actionType: "APPROVER",
        status: "REJECTED",
      },
    ],
    remark: "Price exceeds maximum threshold for hardware intake.",
    createdAt: "2026-03-03T09:15:00.000Z",
  },
];

export async function getRequests(): Promise<InventoryRequest[]> {
  try {
    const data = await request<InventoryRequest[]>(
      API_ENDPOINTS.REQUESTS.LIST,
      "GET",
    );
    return Array.isArray(data) && data.length > 0 ? data : MOCK_REQUESTS;
  } catch {
    return MOCK_REQUESTS;
  }
}

export async function createProductRequest(
  payload: CreateProductRequestInput | FormData,
): Promise<unknown> {
  try {
    return await request(API_ENDPOINTS.REQUESTS.CREATE, "POST", payload);
  } catch (err) {
    console.warn(
      "Backend requests/create offline, saving to mock requests list:",
      err,
    );
    const newReq: InventoryRequest = {
      id: `req-${Date.now().toString().slice(-6)}`,
      requestType: "PRODUCT_CREATE",
      status: "PENDING",
      product:
        !(payload instanceof FormData) && payload.product
          ? payload.product
          : {
              productCode: "NEW-ITEM",
              productName: "New Product Request",
              categoryCode: "GENERAL",
              brandCode: "GENERAL",
              hasVariants: false,
              unit: "PCS",
              productSku: "NEW-ITEM",
            },
      variants:
        !(payload instanceof FormData) && payload.variants
          ? payload.variants
          : [],
      stock:
        !(payload instanceof FormData) && payload.stock ? payload.stock : [],
      createdAt: new Date().toISOString(),
    };
    MOCK_REQUESTS.unshift(newReq);
    return { success: true, data: newReq };
  }
}

export async function commitRequest(
  id: string,
  payload: CommitRequestInput,
): Promise<unknown> {
  try {
    return await request(API_ENDPOINTS.REQUESTS.COMMIT(id), "POST", payload);
  } catch (err) {
    console.warn(
      "Backend requests/commit offline, updating mock request:",
      err,
    );
    const target = MOCK_REQUESTS.find((r) => r.id === id);
    if (target) {
      target.status = payload.action === "APPROVE" ? "APPROVED" : "REJECTED";
      target.remark = payload.remark;
      if (target.approvers) {
        target.approvers.forEach((a) => {
          a.status = payload.action === "APPROVE" ? "APPROVED" : "REJECTED";
        });
      }
    }
    return { success: true };
  }
}

export async function importRequestsFile(file: File): Promise<unknown> {
  try {
    const formData = new FormData();
    formData.append("requestType", "PRODUCT_CREATE");
    formData.append("file", file);
    return await request(API_ENDPOINTS.REQUESTS.IMPORT, "POST", formData);
  } catch (err) {
    console.warn(
      "Backend requests/import offline, returning mock import success:",
      err,
    );
    return { success: true, count: 2 };
  }
}

export async function getImportTemplate(): Promise<unknown> {
  try {
    return await request(API_ENDPOINTS.REQUESTS.IMPORT_TEMPLATE, "GET");
  } catch {
    return { success: true };
  }
}
