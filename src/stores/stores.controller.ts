import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import type { AuthRequest } from '../types/auth-request.type';

@ApiTags('tiendas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COORDINADOR)
@Controller('tiendas')
export class StoresController {
  constructor(private readonly service: StoresService) {}

  @Post()
  create(@Body() dto: CreateStoreDto, @Request() req: AuthRequest) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'regional', required: false })
  @ApiQuery({ name: 'city', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('regional') regional?: string,
    @Query('city') city?: string,
  ) {
    return this.service.findAll(
      Number(page) || 1,
      Number(limit) || 20,
      q,
      regional,
      city,
    );
  }

  @Get('codigo/:code')
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
    @Request() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
