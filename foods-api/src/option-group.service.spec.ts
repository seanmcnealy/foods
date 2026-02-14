import { Test, TestingModule } from '@nestjs/testing';
import { KnexModule } from 'nest-knexjs';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Knex } from 'knex';
import { OptionGroupService } from './option-group.service';
import assert from 'node:assert';

describe('OptionGroupService', () => {
  let service: OptionGroupService;
  let container: StartedPostgreSqlContainer;
  let module: TestingModule;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine').start();

    module = await Test.createTestingModule({
      imports: [
        KnexModule.forRoot({
          config: {
            client: 'pg',
            connection: {
              host: container.getHost(),
              port: container.getPort(),
              user: container.getUsername(),
              password: container.getPassword(),
              database: container.getDatabase(),
            },
          },
        }),
      ],
      providers: [OptionGroupService],
    }).compile();

    service = module.get<OptionGroupService>(OptionGroupService);
    const knex = module.get<Knex>('default');

    await knex.schema.createTable('option_group', (table) => {
      table.increments('id').primary();
      table.string('brand_id').notNullable();
      table.string('description').notNullable();
      table.boolean('mandatory').notNullable();
      table.boolean('supports_choice_quantities').notNullable();
      table.integer('choice_quantity_increment').notNullable();
      table.string('explanation_text');
      table.integer('sort_order').notNullable();
    });

    await knex.schema.createTable('option', (table) => {
      table.increments('id').primary();
      table.string('brand_id').notNullable();
      table.string('name').notNullable();
      table.boolean('is_default').notNullable();
      table.decimal('cost', 10, 4).notNullable();
      table.boolean('adjusts_parent_calories').notNullable();
      table.boolean('adjusts_parent_price').notNullable();
      table.integer('sort_order').notNullable();
      table.decimal('price', 10, 4);
    });

    await knex.schema.createTable('option_group_option_link', (table) => {
      table.integer('option_group_id').references('id').inTable('option_group');
      table.integer('option_id').references('id').inTable('option');
      table.primary(['option_group_id', 'option_id']);
    });

    await knex('option_group').insert([
      {
        id: 1,
        brand_id: 'brand-1',
        description: 'Size',
        mandatory: true,
        supports_choice_quantities: false,
        choice_quantity_increment: 1,
        sort_order: 0,
      },
      {
        id: 2,
        brand_id: 'brand-1',
        description: 'Remove Ingredients',
        mandatory: false,
        supports_choice_quantities: false,
        choice_quantity_increment: 1,
        explanation_text: 'Select items to remove',
        sort_order: 1,
      },
      {
        id: 3,
        brand_id: 'brand-1',
        description: 'Add Extra Cheese',
        mandatory: false,
        supports_choice_quantities: true,
        choice_quantity_increment: 1,
        sort_order: 2,
      },
      {
        id: 4,
        brand_id: 'brand-2',
        description: 'Toppings',
        mandatory: false,
        supports_choice_quantities: true,
        choice_quantity_increment: 1,
        sort_order: 0,
      },
    ]);

    await knex('option').insert([
      {
        id: 1,
        brand_id: 'brand-1',
        name: 'Small',
        is_default: false,
        cost: '8.29',
        adjusts_parent_calories: true,
        adjusts_parent_price: false,
        sort_order: 0,
      },
      {
        id: 2,
        brand_id: 'brand-1',
        name: 'Medium',
        is_default: true,
        cost: '10.29',
        adjusts_parent_calories: true,
        adjusts_parent_price: true,
        sort_order: 1,
      },
    ]);

    await knex('option_group_option_link').insert([
      { option_group_id: 1, option_id: 1 },
      { option_group_id: 1, option_id: 2 },
    ]);
  }, 60000);

  afterAll(async () => {
    await module.close();
    await container.stop();
  });

  describe('getOptionGroups', () => {
    it('should return all option groups for a brand', async () => {
      const result = await service.getOptionGroups('brand-1', {});
      expect(result).toHaveLength(3);
    });

    it('should not return option groups from other brands', async () => {
      const result = await service.getOptionGroups('brand-1', {});
      expect(result.map((og) => og.description)).not.toContain('Toppings');
    });

    it('should order by sort_order', async () => {
      const result = await service.getOptionGroups('brand-1', {});
      expect(result[0].description).toBe('Size');
      expect(result[1].description).toBe('Remove Ingredients');
      expect(result[2].description).toBe('Add Extra Cheese');
    });

    it('should filter by description', async () => {
      const result = await service.getOptionGroups('brand-1', {
        description: 'Remove',
      });
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Remove Ingredients');
    });

    it('should filter by mandatory', async () => {
      const result = await service.getOptionGroups('brand-1', {
        mandatory: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Size');
    });

    it('should filter by supports_choice_quantities', async () => {
      const result = await service.getOptionGroups('brand-1', {
        supportsChoiceQuantities: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Add Extra Cheese');
    });

    it('should filter by explanation_text', async () => {
      const result = await service.getOptionGroups('brand-1', {
        explanationText: 'items to remove',
      });
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Remove Ingredients');
    });

    it('should return empty array when no matches', async () => {
      const result = await service.getOptionGroups('brand-1', {
        description: 'Nonexistent',
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('getOptionGroupById', () => {
    it('should return a single option group by id', async () => {
      const result = await service.getOptionGroupById('brand-1', '1');
      assert.ok(result);
      expect(result.description).toBe('Size');
      expect(result.mandatory).toBe(true);
    });

    it('should include options via join', async () => {
      const result = await service.getOptionGroupById('brand-1', '1');
      assert.ok(result);
      assert.ok(result.options);
      expect(result.options).toHaveLength(2);
      const names = result.options.map((o) => o.name);
      expect(names).toEqual(expect.arrayContaining(['Small', 'Medium']));
    });
  });
});
