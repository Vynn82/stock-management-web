"use client";

import MasterCardsPage from "./MasterCardsPage";
import { categoriesApi } from "@/features/live/master-data";

export default function CategoriesPage() {
  return <MasterCardsPage title="Categories" singular="category" placeholder="e.g. Electronics" countKey="byCategory" resource={categoriesApi} />;
}
