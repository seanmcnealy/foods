import { Test, TestingModule } from '@nestjs/testing';
import { KnexModule } from 'nest-knexjs';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Knex } from 'knex';
import { ProductService } from './product.service';
import assert from 'node:assert';

describe('ProductService', () => {
  let service: ProductService;
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
      providers: [ProductService],
    }).compile();

    service = module.get<ProductService>(ProductService);
    const knex = module.get<Knex>('default');

    await knex.schema.createTable('product', (table) => {
      table.increments('id').primary();
      table.string('brand_id').notNullable();
      table.integer('category_id').notNullable();
      table.integer('chainproduct_id').notNullable();
      table.string('name').notNullable();
      table.string('description');
      table.decimal('cost', 10, 4).notNullable();
      table.integer('base_calories');
      table.integer('max_calories');
      table.string('extref').notNullable();
      table.boolean('is_disabled').notNullable();
      table.integer('minimum_quantity').notNullable();
      table.integer('quantity_increment').notNullable();
      table.string('short_description');
      table.integer('sort_order').notNullable();
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

    await knex.schema.createTable('product_option_group_link', (table) => {
      table.integer('product_id').references('id').inTable('product');
      table.integer('option_group_id').references('id').inTable('option_group');
      table.primary(['product_id', 'option_group_id']);
    });

    await knex('product').insert([
      {
        id: 1,
        brand_id: 'brand-1',
        category_id: 10,
        chainproduct_id: 100,
        name: 'Turkey Club',
        description: 'A classic turkey sandwich',
        cost: '8.29',
        base_calories: 500,
        max_calories: 1580,
        extref: 'ext-p1',
        is_disabled: false,
        minimum_quantity: 1,
        quantity_increment: 1,
        sort_order: 0,
      },
      {
        id: 2,
        brand_id: 'brand-1',
        category_id: 10,
        chainproduct_id: 101,
        name: 'BLT',
        description: 'Bacon lettuce tomato',
        cost: '7.49',
        base_calories: 400,
        max_calories: 800,
        extref: 'ext-p2',
        is_disabled: false,
        minimum_quantity: 1,
        quantity_increment: 1,
        sort_order: 1,
      },
      {
        id: 3,
        brand_id: 'brand-1',
        category_id: 20,
        chainproduct_id: 102,
        name: 'Caesar Salad',
        description: 'Fresh romaine salad',
        cost: '6.99',
        extref: 'ext-p3',
        is_disabled: true,
        minimum_quantity: 1,
        quantity_increment: 1,
        sort_order: 0,
      },
      {
        id: 4,
        brand_id: 'brand-2',
        category_id: 30,
        chainproduct_id: 200,
        name: 'Pepperoni Pizza',
        description: 'Classic pepperoni',
        cost: '12.99',
        extref: 'ext-p4',
        is_disabled: false,
        minimum_quantity: 1,
        quantity_increment: 1,
        sort_order: 0,
      },
    ]);

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
        sort_order: 1,
      },
    ]);

    await knex('product_option_group_link').insert([
      { product_id: 1, option_group_id: 1 },
      { product_id: 1, option_group_id: 2 },
    ]);
  }, 60000);

  afterAll(async () => {
    await module.close();
    await container.stop();
  });

  describe('getProducts', () => {
    it('should return all products for a brand', async () => {
      const result = await service.getProducts('brand-1', {});
      expect(result).toHaveLength(3);
    });

    it('should not return products from other brands', async () => {
      const result = await service.getProducts('brand-1', {});
      expect(result.map((p) => p.name)).not.toContain('Pepperoni Pizza');
    });

    it('should order by sort_order', async () => {
      const result = await service.getProducts('brand-1', {
        categoryId: 10,
      });
      expect(result[0].name).toBe('Turkey Club');
      expect(result[1].name).toBe('BLT');
    });

    it('should filter by name', async () => {
      const result = await service.getProducts('brand-1', { name: 'Turkey' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Turkey Club');
    });

    it('should filter by description', async () => {
      const result = await service.getProducts('brand-1', {
        description: 'romaine',
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Caesar Salad');
    });

    it('should filter by extref', async () => {
      const result = await service.getProducts('brand-1', {
        extref: 'ext-p2',
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('BLT');
    });

    it('should filter by category_id', async () => {
      const result = await service.getProducts('brand-1', { categoryId: 20 });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Caesar Salad');
    });

    it('should filter by isdisabled', async () => {
      const result = await service.getProducts('brand-1', { isDisabled: true });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Caesar Salad');
    });

    it('should return empty array when no matches', async () => {
      const result = await service.getProducts('brand-1', {
        name: 'Nonexistent',
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('getProductById', () => {
    it('should return a single product by id', async () => {
      const result = await service.getProductById('brand-1', '1');
      assert.ok(result);
      expect(result.name).toBe('Turkey Club');
      expect(result.extref).toBe('ext-p1');
    });

    it('should include option_groups via join', async () => {
      const result = await service.getProductById('brand-1', '1');
      assert.ok(result);
      expect(result.option_groups).toHaveLength(2);
      const descriptions = result.option_groups.map((og) => og.description);
      expect(descriptions).toEqual(
        expect.arrayContaining(['Size', 'Remove Ingredients']),
      );
    });

    it('should return empty option_groups when none linked', async () => {
      const result = await service.getProductById('brand-1', '2');
      assert.ok(result);
      expect(result.option_groups).toHaveLength(0);
    });
  });
});
