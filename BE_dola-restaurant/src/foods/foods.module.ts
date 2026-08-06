import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './entities/food.entity';
import { FoodImage } from './entities/food-image.entity';
import { FoodsService } from './foods.service';
import { FoodsController } from './foods.controller';
import { PublicFoodsController } from './public-foods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Food, FoodImage])],
  controllers: [FoodsController, PublicFoodsController],
  providers: [FoodsService],
  exports: [FoodsService],
})
export class FoodsModule {}
