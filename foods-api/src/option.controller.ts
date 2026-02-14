import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { OptionService } from './option.service';
import { Option, OptionSearchDto } from './dto/option';

@Controller('/brand/:brandId/options')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @Get()
  getOptions(
    @Param('brandId') brandId: string,
    @Query(new ValidationPipe({ transform: true })) search: OptionSearchDto,
  ): Promise<Option[]> {
    return this.optionService.getOptions(brandId, search);
  }

  @Get(':id')
  async getOption(
    @Param('brandId') brandId: string,
    @Param('id') id: string,
  ): Promise<Option> {
    const option = await this.optionService.getOptionById(brandId, id);
    if (option) {
      return option;
    }
    throw new NotFoundException();
  }
}
