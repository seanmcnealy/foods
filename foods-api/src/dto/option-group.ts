import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { z } from 'zod';
import { BooleanTransformer } from './boolean.transformer';

export const OptionGroupOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const OptionGroupSchema = z.object({
  id: z.number(),
  description: z.string(),
  mandatory: z.boolean(),
  supports_choice_quantities: z.boolean(),
  choice_quantity_increment: z.number(),
  explanation_text: z.string().nullish(),
  sort_order: z.number(),
  options: z.array(OptionGroupOptionSchema).nullish(),
});

export type OptionGroup = z.infer<typeof OptionGroupSchema>;

export class OptionGroupSearchDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  mandatory?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  supportsChoiceQuantities?: boolean;

  @IsOptional()
  @IsString()
  explanationText?: string;
}
