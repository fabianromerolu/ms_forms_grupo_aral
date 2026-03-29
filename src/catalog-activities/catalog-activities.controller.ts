import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CatalogActivitiesService } from './catalog-activities.service';
import { ListCatalogActivitiesQueryDto } from './dto/list-catalog-activities.query.dto';
import { UpdateCatalogActivityDto } from './dto/update-catalog-activity.dto';

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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCatalogActivityDto) {
    return this.service.update(id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
