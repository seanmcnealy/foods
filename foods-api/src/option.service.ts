import { Injectable } from '@nestjs/common';
import { InjectConnection } from 'nest-knexjs';
import { Knex } from 'knex';
import { Option, OptionSchema, OptionSearchDto } from './dto/option';

@Injectable()
export class OptionService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async getOptions(
    brandId: string,
    search: OptionSearchDto,
  ): Promise<Option[]> {
    const query = this.knex<Option>('option')
      .select('*')
      .where('brand_id', brandId)
      .orderBy('sort_order');

    if (search.name) {
      query.where('name', 'ilike', `%${search.name}%`);
    }
    if (search.is_default !== undefined) {
      query.where('is_default', search.is_default);
    }
    if (search.adjusts_parent_price !== undefined) {
      query.where('adjusts_parent_price', search.adjusts_parent_price);
    }
    if (search.option_group_id !== undefined) {
      query.where('option_group_id', search.option_group_id);
    }

    const rows = await query;
    return rows.map((row) => OptionSchema.parse(row));
  }

  async getOptionById(brandId: string, id: string): Promise<Option | null> {
    const row = await this.knex<Option>('option')
      .select([
        'option.id',
        'option.name',
        'option.is_default',
        'option.cost',
        'option.adjusts_parent_calories',
        'option.adjusts_parent_price',
        'option.sort_order',
        this.knex.raw(
          "COALESCE(JSONB_AGG( TO_JSONB( (SELECT r FROM (SELECT option_group.id, option_group.description) r WHERE r IS NOT NULL))) FILTER( WHERE option_group.id IS NOT NULL), '[]'::JSONB) as option_groups",
        ),
      ])
      .leftJoin(
        'option_option_group_link',
        'option.id',
        'option_option_group_link.option_id',
      )
      .leftJoin(
        'option_group',
        'option_option_group_link.option_group_id',
        'option_group.id',
      )
      .where('option.id', id)
      .where('option.brand_id', brandId)
      .groupBy<Option>('option.id')
      .first();
    if (row) {
      return OptionSchema.parse(row);
    } else {
      return null;
    }
  }
}
