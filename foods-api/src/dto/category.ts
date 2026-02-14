import { IsOptional, IsString } from 'class-validator';
import { z } from 'zod';

export const CategoryProductSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  extref: z.string(),
  sortorder: z.number(),
  products: z.array(CategoryProductSchema).nullish(),
});

export type Category = z.infer<typeof CategorySchema>;

export class CategorySearchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  extref?: string;
}
