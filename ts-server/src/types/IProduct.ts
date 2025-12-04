export interface CreateProductDTO {
  name: string;
  type?: string;
  price: number;
  discountedPercentage?: number;
  stock?: number;
  description: string;
  tags?: string[];
  weight?: number;
  isAvailable?: boolean;
  badge?: boolean;
  offer?: boolean;
  stockThreshold?: number;
  categoryId?: string;
  brandId?: string;
}

export type UpdateProductDTO = Partial<CreateProductDTO>

export interface UpdateStockDTO {
  stock: number;
}
