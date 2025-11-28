export interface CreateCategoryDTO {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}
