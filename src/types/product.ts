export interface Product {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
  stock?: number;
  rating?: number;
  productImg?: string;
  productName?: string;
  productDesc?: string;
  salesPrice?: string | number;
  sku?: string;
  originalPrice?: string | number;
  discount?: string | number | null;
  potSize?: string | null;
  plantHeight?: string | null;
  preparationTime?: string | null;
  stockStatus?: string;
  categoryId?: number;
  productStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
}
