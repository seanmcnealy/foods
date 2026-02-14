import { Injectable } from '@nestjs/common';
import { InjectConnection } from 'nest-knexjs';
import { Knex } from 'knex';
import {
  OptionGroup,
  OptionGroupSchema,
  OptionGroupSearchDto,
} from './dto/option-group';

@Injectable()
export class OptionGroupService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async getOptionGroups(
    brandId: string,
    search: OptionGroupSearchDto,
  ): Promise<OptionGroup[]> {
    const query = this.knex<OptionGroup>('option_group')
      .select('*')
      .where('brand_id', brandId)
      .orderBy('sort_order');

    if (search.description) {
      query.where('description', 'ilike', `%${search.description}%`);
    }
    if (search.mandatory !== undefined) {
      query.where('mandatory', search.mandatory);
    }
    if (search.supports_choice_quantities !== undefined) {
      query.where(
        'supports_choice_quantities',
        search.supports_choice_quantities,
      );
    }
    if (search.explanation_text) {
      query.where('explanation_text', 'ilike', `%${search.explanation_text}%`);
    }

    const rows = await query;
    return rows.map((row) => OptionGroupSchema.parse(row));
  }

  async getOptionGroupById(
    brandId: string,
    id: string,
  ): Promise<OptionGroup | null> {
    const row = await this.knex<OptionGroup>('option_group')
      .select([
        'option_group.id',
        'option_group.description',
        'option_group.mandatory',
        'option_group.supports_choice_quantities',
        'option_group.choice_quantity_increment',
        'option_group.explanation_text',
        'option_group.sort_order',
        this.knex.raw(
          "COALESCE(JSONB_AGG( TO_JSONB( (SELECT r FROM (SELECT option.id, option.name) r WHERE r IS NOT NULL))) FILTER( WHERE option.id IS NOT NULL), '[]'::JSONB) as options",
        ),
      ])
      .innerJoin<OptionGroup>(
        'option_group_option_link',
        'option_group.id',
        'option_group_option_link.option_group_id',
      )
      .innerJoin<OptionGroup>(
        'option',
        'option_group_option_link.option_id',
        'option.id',
      )
      .where('option_group.id', id)
      .where('option_group.brand_id', brandId)
      .groupBy<OptionGroup>('option_group.id')
      .first();
    return OptionGroupSchema.parse(row);
  }
}
