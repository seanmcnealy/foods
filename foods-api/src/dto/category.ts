import { IsOptional, IsString } from 'class-validator';
import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  extref: z.string(),
  sortorder: z.number(),
  product_names: z.array(z.string()).nullish(),
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
