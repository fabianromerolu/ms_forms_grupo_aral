import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogActivitiesService } from './catalog-activities.service';
import { ListCatalogActivitiesQueryDto } from './dto/list-catalog-activities.query.dto';

@ApiTags('catalog-activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalog-activities')
export class CatalogActivitiesController {
  constructor(private readonly service: CatalogActivitiesService) {}

  @Get()
  findAll(@Query() q: ListCatalogActivitiesQueryDto) {
    return this.service.findAll(
      q.page ? Number(q.page) : 1,
      q.limit ? Number(q.limit) : 50,
      q.q,
      q.specialty,
      q.chapter,
    );
  }

  @Get('specialties')
  getSpecialties() {
    return this.service.getSpecialties();
  }

  @Get('chapters')
  getChapters(@Query('specialty') specialty?: string) {
    return this.service.getChapters(specialty);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
