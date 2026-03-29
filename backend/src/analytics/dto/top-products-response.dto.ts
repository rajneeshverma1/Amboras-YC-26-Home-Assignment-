export class ProductMetricDto {
  productId: string;
  productName: string;
  revenue: number;
  quantitySold: number;
}

export class TopProductsResponseDto {
  products: ProductMetricDto[];
}
