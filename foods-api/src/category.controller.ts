import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category, CategorySearchDto } from './dto/category';

@Controller('/brand/:brandId/categories')
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
  getCategory(
    @Param('brandId') brandId: string,
    @Param('id') id: string,
  ): Promise<Category> {
    return this.appService.getCategory(brandId, id);
  }
}
