"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateIncidentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateIncidentDto {
    incidentNumber;
    tiendaId;
    storeCode;
    storeName;
    city;
    department;
    maintenanceType;
    customMaintenanceType;
    specialty;
    description;
    expirationAt;
    priority;
    quotedAmount;
    saleCost;
    purchaseOrderNumber;
    purchaseOrderDocumentUrl;
    purchaseOrderDocumentName;
    invoiceNumber;
    invoiceDocumentUrl;
    invoiceDocumentName;
    consolidatedNote;
    consolidatedDocumentUrl;
    consolidatedDocumentName;
    createdBy;
}
exports.CreateIncidentDto = CreateIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número o serial entregado por el solicitante' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "incidentNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de tienda registrada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "tiendaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "storeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre de la tienda' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "storeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.IncidenciaMaintenanceType }),
    (0, class_validator_1.IsEnum)(client_1.IncidenciaMaintenanceType),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "maintenanceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tipo personalizado cuando es OTRO' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "customMaintenanceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "specialty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "expirationAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.IncidenciaPriority }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.IncidenciaPriority),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateIncidentDto.prototype, "quotedAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateIncidentDto.prototype, "saleCost", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "purchaseOrderNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "purchaseOrderDocumentUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "purchaseOrderDocumentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "invoiceDocumentUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "invoiceDocumentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "consolidatedNote", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "consolidatedDocumentUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "consolidatedDocumentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "createdBy", void 0);
//# sourceMappingURL=create-incident.dto.js.map