import { Module } from '@nestjs/common';
import { TypologiesController } from './typologies.controller';
import { TypologiesService } from './typologies.service';

@Module({
  controllers: [TypologiesController],
  providers: [TypologiesService],
  exports: [TypologiesService],
})
export class TypologiesModule {}
