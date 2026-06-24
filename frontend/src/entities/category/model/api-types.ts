export interface CategoryResponse {
  id: number;
  name: string;
}

export interface CategoryListResponse {
  items: CategoryResponse[];
}
