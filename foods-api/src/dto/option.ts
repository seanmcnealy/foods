import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { z } from 'zod';
import { BooleanTransformer } from './boolean.transformer';

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
  option_groups: z.array(OptionOptionGroupsSchema).nullish(),
});

export type Option = z.infer<typeof OptionSchema>;

export class OptionSearchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  adjustsParentPrice?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  optionGroupId?: number;
}
