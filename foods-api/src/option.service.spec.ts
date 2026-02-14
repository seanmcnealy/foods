import { Test, TestingModule } from '@nestjs/testing';
import { KnexModule } from 'nest-knexjs';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Knex } from 'knex';
import { OptionService } from './option.service';
import assert from 'node:assert';

describe('OptionService', () => {
  let service: OptionService;
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
      providers: [OptionService],
    }).compile();

    service = module.get<OptionService>(OptionService);
    const knex = module.get<Knex>('default');

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
      table.integer('option_group_id');
    });

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

    await knex.schema.createTable('option_option_group_link', (table) => {
      table.integer('option_id').references('id').inTable('option');
      table.integer('option_group_id').references('id').inTable('option_group');
      table.primary(['option_id', 'option_group_id']);
    });

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
        price: '8.29',
        option_group_id: 10,
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
        price: '10.29',
        option_group_id: 10,
      },
      {
        id: 3,
        brand_id: 'brand-1',
        name: 'No Bacon',
        is_default: false,
        cost: '0.00',
        adjusts_parent_calories: false,
        adjusts_parent_price: false,
        sort_order: 0,
        option_group_id: 20,
      },
      {
        id: 4,
        brand_id: 'brand-2',
        name: 'Large',
        is_default: false,
        cost: '12.99',
        adjusts_parent_calories: true,
        adjusts_parent_price: true,
        sort_order: 0,
        option_group_id: 30,
      },
    ]);

    await knex('option_group').insert([
      {
        id: 1,
        brand_id: 'brand-1',
        description: 'Remove Ingredients',
        mandatory: false,
        supports_choice_quantities: false,
        choice_quantity_increment: 1,
        sort_order: 0,
      },
      {
        id: 2,
        brand_id: 'brand-1',
        description: 'Add Extra',
        mandatory: false,
        supports_choice_quantities: true,
        choice_quantity_increment: 1,
        sort_order: 1,
      },
    ]);

    await knex('option_option_group_link').insert([
      { option_id: 1, option_group_id: 1 },
      { option_id: 1, option_group_id: 2 },
    ]);
  }, 60000);

  afterAll(async () => {
    await module.close();
    await container.stop();
  });

  describe('getOptions', () => {
    it('should return all options for a brand', async () => {
      const result = await service.getOptions('brand-1', {});
      expect(result).toHaveLength(3);
    });

    it('should not return options from other brands', async () => {
      const result = await service.getOptions('brand-1', {});
      expect(result.map((o) => o.name)).not.toContain('Large');
    });

    it('should order by sort_order', async () => {
      const result = await service.getOptions('brand-1', {
        optionGroupId: 10,
      });
      expect(result[0].name).toBe('Small');
      expect(result[1].name).toBe('Medium');
    });

    it('should filter by name', async () => {
      const result = await service.getOptions('brand-1', { name: 'Small' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Small');
    });

    it('should filter by is_default', async () => {
      const result = await service.getOptions('brand-1', { isDefault: true });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Medium');
    });

    it('should filter by adjusts_parent_price', async () => {
      const result = await service.getOptions('brand-1', {
        adjustsParentPrice: false,
      });
      expect(result).toHaveLength(2);
      expect(result.map((o) => o.name)).toEqual(
        expect.arrayContaining(['Small', 'No Bacon']),
      );
    });

    it('should filter by option_group_id', async () => {
      const result = await service.getOptions('brand-1', {
        optionGroupId: 20,
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('No Bacon');
    });

    it('should return empty array when no matches', async () => {
      const result = await service.getOptions('brand-1', {
        name: 'Nonexistent',
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('getOptionById', () => {
    it('should return a single option by id', async () => {
      const result = await service.getOptionById('brand-1', '1');
      assert.ok(result);
      expect(result.name).toBe('Small');
      expect(result.is_default).toBe(false);
    });

    it('should include option_groups via join', async () => {
      const result = await service.getOptionById('brand-1', '1');
      assert.ok(result);
      expect(result.option_groups).toHaveLength(2);
      const descriptions = result.option_groups.map((og) => og.description);
      expect(descriptions).toEqual(
        expect.arrayContaining(['Remove Ingredients', 'Add Extra']),
      );
    });

    it('should return empty option_groups when none linked', async () => {
      const result = await service.getOptionById('brand-1', '3');
      assert.ok(result);
      expect(result.option_groups).toHaveLength(0);
    });
  });
});
