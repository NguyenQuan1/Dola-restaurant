import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Request() req: any, @Body() dto: CreateReviewDto) {
    const userId = req.user?.userId || req.user?.id;
    return this.reviewsService.create(userId, dto);
  }

  @Get()
  findAll
  (@Query('foodId') foodId?: string, @Query('onlyApproved') onlyApproved?: string) {
    const foodIdNum = foodId ? Number(foodId) : undefined;
    const isPublic = onlyApproved === 'true';
    return this.reviewsService.findAll(foodIdNum, isPublic);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Post(':id/reply')
  @UseGuards(AuthGuard('jwt'))
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: ReplyReviewDto,
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.reviewsService.reply(id, userId, dto.replyText);
  }

  @Patch(':id/toggle-approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  toggleApprove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.toggleApprove(id);
  }
}
