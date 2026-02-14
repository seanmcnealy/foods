import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { OptionGroupService } from './option-group.service';
import { OptionGroup, OptionGroupSearchDto } from './dto/option-group';

@Controller('/brand/:brandId/option-group')
export class OptionGroupController {
  constructor(private readonly optionGroupService: OptionGroupService) {}

  @Get()
  getOptionGroups(
    @Param('brandId') brandId: string,
    @Query(new ValidationPipe({ transform: true }))
    search: OptionGroupSearchDto,
  ): Promise<OptionGroup[]> {
    return this.optionGroupService.getOptionGroups(brandId, search);
  }

  @Get(':id')
  getOptionGroup(
    @Param('brandId') brandId: string,
    @Param('id') id: string,
  ): Promise<OptionGroup | null> {
    return this.optionGroupService.getOptionGroupById(brandId, id);
  }
}
