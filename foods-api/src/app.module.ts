import { Module } from '@nestjs/common';
import { KnexModule } from 'nest-knexjs';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { OptionController } from './option.controller';
import { OptionService } from './option.service';
import { OptionGroupController } from './option-group.controller';
import { OptionGroupService } from './option-group.service';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    KnexModule.forRoot({
      config: {
        client: 'pg',
        connection: {
          host: 'localhost',
          port: 5432,
          user: 'gotofoods',
          password: 'gotofoodspassword123',
          database: 'gotofoods',
        },
      },
    }),
  ],
  controllers: [
    CategoryController,
    ProductController,
    OptionGroupController,
    OptionController,
  ],
  providers: [
    CategoryService,
    ProductService,
    OptionGroupService,
    OptionService,
  ],
})
export class AppModule {}
