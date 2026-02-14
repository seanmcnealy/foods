import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category, CategorySearchDto } from './dto/category';

@Controller('/brand/:brandId/category')
export class CategoryController {
  constructor(private readonly appService: CategoryService) {}

  @Get()
  getCategories(
    @Param('brandId') brandId: string,
    @Query(new ValidationPipe({ transform: true }))
    categorySearch: CategorySearchDto,
  ): Promise<Category[]> {
    return this.appService.getCategories(brandId, categorySearch);
  }

  @Get(':id')
  async getCategory(
    @Param('brandId') brandId: string,
    @Param('id') id: string,
  ): Promise<Category> {
    const category = await this.appService.getCategory(brandId, id);
    if (category) {
      return category;
    }
    throw new NotFoundException();
  }
}
