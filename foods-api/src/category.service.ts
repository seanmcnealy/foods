import { Injectable } from '@nestjs/common';
import { InjectConnection } from 'nest-knexjs';
import { Knex } from 'knex';
import { Category, CategorySchema, CategorySearchDto } from './dto/category';

@Injectable()
export class CategoryService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async getCategories(
    brandId: string,
    categorySearch: CategorySearchDto,
  ): Promise<Category[]> {
    const query = this.knex<Category>('category')
      .leftJoin('product', 'category.id', 'product.category_id')
      .select([
        'category.id',
        'category.name',
        'category.extref',
        'category.sortorder',
        this.knex.raw(
          "COALESCE(JSONB_AGG( TO_JSONB( (SELECT r FROM (SELECT product.id, product.name) r))) FILTER(WHERE product.id IS NOT NULL), '[]'::JSONB) as products",
        ),
      ])
      .where('category.brand_id', brandId)
      .groupBy('category.id');

    if (categorySearch.name) {
      query.where('category.name', 'ilike', `%${categorySearch.name}%`);
    }
    if (categorySearch.extref) {
      query.where('extref', categorySearch.extref);
    }

    const rows = await query;
    return rows.map((row) => CategorySchema.parse(row));
  }

  async getCategory(brandId: string, id: string): Promise<Category | null> {
    const row = await this.knex<Category>('category')
      .select([
        'category.id',
        'category.name',
        'category.extref',
        'category.sortorder',
        this.knex.raw(
          "COALESCE(JSONB_AGG( TO_JSONB( (SELECT r FROM (SELECT product.id, product.name) r))) FILTER(WHERE product.id IS NOT NULL), '[]'::JSONB) as products",
        ),
      ])
      .leftJoin('product', 'category.id', 'product.category_id')
      .groupBy<Category>('category.id')
      .where('category.id', id)
      .where('category.brand_id', brandId)
      .orderBy('category.sortorder')
      .first();
    if (row) {
      return CategorySchema.parse(row);
    } else {
      return null;
    }
  }
}
