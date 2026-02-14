import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product, ProductSearchDto } from './dto/product';

@Controller('/brand/:brandId/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  getProducts(
    @Param('brandId') brandId: string,
    @Query(new ValidationPipe({ transform: true }))
    productSearch: ProductSearchDto,
  ): Promise<Product[]> {
    return this.productService.getProducts(brandId, productSearch);
  }

  @Get(':id')
  async getProduct(
    @Param('brandId') brandId: string,
    @Param('id') id: string,
  ): Promise<Product> {
    const product = await this.productService.getProductById(brandId, id);
    if (product) {
      return product;
    }
    throw new NotFoundException();
  }
}
