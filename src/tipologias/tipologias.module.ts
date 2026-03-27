import { Module } from '@nestjs/common';
import { TipologiasController } from './tipologias.controller';
import { TipologiasService } from './tipologias.service';

@Module({
  controllers: [TipologiasController],
  providers: [TipologiasService],
  exports: [TipologiasService],
})
export class TipologiasModule {}
