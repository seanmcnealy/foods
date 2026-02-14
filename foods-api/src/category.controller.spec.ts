import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from './dto/category';

describe('CategoryController', () => {
  let categoryController: CategoryController;

  const category: Category = {
    id: 1,
    name: 'name',
    extref: 'extref',
    sortorder: 1,
  };

  const mockCategoryService = {
    getCategory: jest.fn().mockReturnValue(category),
    getCategories: jest.fn().mockReturnValue([category]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile();

    categoryController = module.get<CategoryController>(CategoryController);
  });

  describe('CategoryController', () => {
    it('should return a category', () => {
      expect(
        categoryController.getCategories('brandId', { name: 'test' }),
      ).toEqual([category]);
      expect(mockCategoryService.getCategories).toHaveBeenCalledWith(
        'brandId',
        {
          name: 'test',
        },
      );
    });
  });
});
