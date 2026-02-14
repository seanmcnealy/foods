import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { z } from 'zod';

export const OptionOptionGroupsSchema = z.object({
  id: z.number(),
  description: z.string(),
});

export const OptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_default: z.boolean(),
  cost: z.string(),
  adjusts_parent_calories: z.boolean(),
  adjusts_parent_price: z.boolean(),
  sort_order: z.number(),
  price: z.string().nullish(),
  option_groups: z.array(OptionOptionGroupsSchema.nullish()).nullish(),
});

export type Option = z.infer<typeof OptionSchema>;

export class OptionSearchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_default?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  adjusts_parent_price?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  option_group_id?: number;
}
