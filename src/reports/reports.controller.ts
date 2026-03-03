//src/reports/reports.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { ListReportsQueryDto } from "./dto/list-reports.query.dto";
import { UpdateEncargadoSignatureDto } from "./dto/update-encargado-signature.dto";

@ApiTags("reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: ListReportsQueryDto) {
    return this.service.findAll(q);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  // BONUS: para el flujo QR (firma llega después)
  @Patch(":id/encargado-signature")
  updateEncargadoSignature(
    @Param("id") id: string,
    @Body() dto: UpdateEncargadoSignatureDto
  ) {
    return this.service.updateEncargadoSignature(id, dto);
  }
}