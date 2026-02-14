import { Test, TestingModule } from '@nestjs/testing';
import { KnexModule } from 'nest-knexjs';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Knex } from 'knex';
import { CategoryService } from './category.service';
import assert from 'node:assert';

describe('CategoryService', () => {
  let service: CategoryService;
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
      providers: [CategoryService],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    const knex = module.get<Knex>('default');

    await knex.schema.createTable('category', (table) => {
      table.increments('id').primary();
      table.string('brand_id').notNullable();
      table.string('name').notNullable();
      table.string('extref').notNullable();
      table.integer('sortorder').notNullable();
    });

    await knex.schema.createTable('product', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.integer('category_id').references('id').inTable('category');
    });

    await knex('category').insert([
      {
        id: 1,
        brand_id: 'brand-1',
        name: 'Sandwiches',
        extref: 'ext-1',
        sortorder: 0,
      },
      {
        id: 2,
        brand_id: 'brand-1',
        name: 'Salads',
        extref: 'ext-2',
        sortorder: 1,
      },
      {
        id: 3,
        brand_id: 'brand-2',
        name: 'Pizzas',
        extref: 'ext-3',
        sortorder: 0,
      },
    ]);

    await knex('product').insert([
      { name: 'Turkey Club', category_id: 1 },
      { name: 'BLT', category_id: 1 },
      { name: 'Caesar Salad', category_id: 2 },
    ]);
  }, 60000);

  afterAll(async () => {
    await module.close();
    await container.stop();
  });

  describe('getCategories', () => {
    it('should return all categories for a brand', async () => {
      const result = await service.getCategories('brand-1', {});
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toEqual(
        expect.arrayContaining(['Sandwiches', 'Salads']),
      );
    });

    it('should not return categories from other brands', async () => {
      const result = await service.getCategories('brand-1', {});
      expect(result.map((c) => c.name)).not.toContain('Pizzas');
    });

    it('should filter by name', async () => {
      const result = await service.getCategories('brand-1', { name: 'Sand' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sandwiches');
    });

    it('should filter by extref', async () => {
      const result = await service.getCategories('brand-1', {
        extref: 'ext-2',
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Salads');
    });

    it('should return empty array when no matches', async () => {
      const result = await service.getCategories('brand-1', {
        name: 'Nonexistent',
      });
      expect(result).toHaveLength(0);
    });

    it('should include product_names via left join', async () => {
      const result = await service.getCategories('brand-1', {
        name: 'Sandwiches',
      });
      expect(result[0].products.map((p) => p.name)).toEqual(
        expect.arrayContaining(['Turkey Club', 'BLT']),
      );
    });
  });

  describe('getCategory', () => {
    it('should return a single category by id', async () => {
      const result = await service.getCategory('brand-1', '1');
      assert.ok(result);
      expect(result.name).toBe('Sandwiches');
      expect(result.extref).toBe('ext-1');
    });

    it('should include product_names', async () => {
      const result = await service.getCategory('brand-1', '1');
      assert.ok(result);
      expect(result.products.map((p) => p.name)).toEqual(
        expect.arrayContaining(['Turkey Club', 'BLT']),
      );
    });
  });
});
