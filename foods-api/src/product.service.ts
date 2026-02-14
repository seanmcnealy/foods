import { Injectable } from '@nestjs/common';
import { InjectConnection } from 'nest-knexjs';
import { Knex } from 'knex';
import { Product, ProductSchema, ProductSearchDto } from './dto/product';

@Injectable()
export class ProductService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async getProducts(
    brandId: string,
    productSearch: ProductSearchDto,
  ): Promise<Product[]> {
    const query = this.knex<Product>('product')
      .select('*')
      .where('brand_id', brandId)
      .orderBy('sort_order');

    if (productSearch.name) {
      query.where('name', 'ilike', `%${productSearch.name}%`);
    }
    if (productSearch.description) {
      query.where('description', 'ilike', `%${productSearch.description}%`);
    }
    if (productSearch.extref) {
      query.where('extref', productSearch.extref);
    }
    if (productSearch.category_id !== undefined) {
      query.where('category_id', productSearch.category_id);
    }
    if (productSearch.isdisabled !== undefined) {
      query.where('is_disabled', productSearch.isdisabled);
    }

    const rows = await query;
    return rows.map((row) => ProductSchema.parse(row));
  }

  async getProductById(brandId: string, id: string): Promise<Product> {
    const row = await this.knex<Product>('product')
      .select([
        'product.id',
        'product.chainproduct_id',
        'product.category_id',
        'product.name',
        'product.description',
        'product.cost',
        'product.base_calories',
        'product.max_calories',
        'product.extref',
        'product.is_disabled',
        'product.minimum_quantity',
        'product.quantity_increment',
        'product.short_description',
        'product.sort_order',
        this.knex.raw(
          "COALESCE(JSONB_AGG( TO_JSONB( (SELECT r FROM (SELECT option_group.id, option_group.description) r WHERE r IS NOT NULL))) FILTER( WHERE option_group.id IS NOT NULL), '[]'::JSONB) as option_groups",
        ),
      ])
      .leftJoin<Product>(
        'product_option_group_link',
        'product.id',
        'product_option_group_link.product_id',
      )
      .leftJoin<Product>(
        'option_group',
        'product_option_group_link.option_group_id',
        'option_group.id',
      )
      .where('product.id', id)
      .where('product.brand_id', brandId)
      .groupBy<Product>('product.id')
      .first();
    return ProductSchema.parse(row);
  }
}
