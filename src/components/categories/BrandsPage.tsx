"use client";

import MasterCardsPage from "./MasterCardsPage";
import { brandsApi } from "@/features/live/master-data";

export default function BrandsPage() {
  return <MasterCardsPage title="Brands" singular="brand" placeholder="e.g. Samsung" countKey="byBrand" resource={brandsApi} />;
}
