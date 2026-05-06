import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthRequest } from '../types/auth-request.type';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { ListInventoryItemsQueryDto } from './dto/list-inventory-items.query.dto';

@ApiTags('inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COORDINADOR)
@Controller('inventario')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateInventoryItemDto, @Request() req: AuthRequest) {
    return this.service.create(dto, req.user ?? null);
  }

  @Get()
  findAll(@Query() q: ListInventoryItemsQueryDto, @Request() req: AuthRequest) {
    return this.service.findAll(q, req.user ?? null);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.findOne(id, req.user ?? null);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
    @Request() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user ?? null);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.service.remove(id, req.user ?? null);
  }
}
