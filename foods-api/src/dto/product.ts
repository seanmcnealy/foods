import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { z } from 'zod';
import { BooleanTransformer } from './boolean.transformer';

export const ProductOptionGroupsSchema = z.object({
  id: z.number(),
  description: z.string(),
});

export const ProductSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  chainproduct_id: z.number(),
  name: z.string(),
  description: z.string().nullish(),
  cost: z.string(),
  base_calories: z.number().nullish(),
  max_calories: z.number().nullish(),
  extref: z.string(),
  is_disabled: z.boolean(),
  minimum_quantity: z.number(),
  quantity_increment: z.number(),
  short_description: z.string().nullish(),
  sort_order: z.number(),
  option_groups: z.array(ProductOptionGroupsSchema).nullish(),
});

export type Product = z.infer<typeof ProductSchema>;

export class ProductSearchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  extref?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  isDisabled?: boolean;
}
