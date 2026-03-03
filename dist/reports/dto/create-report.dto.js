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
exports.CreateReportDto = exports.MaintenanceSubTipo = exports.MaintenanceTipo = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var MaintenanceTipo;
(function (MaintenanceTipo) {
    MaintenanceTipo["PREVENTIVO"] = "PREVENTIVO";
    MaintenanceTipo["CORRECTIVO"] = "CORRECTIVO";
})(MaintenanceTipo || (exports.MaintenanceTipo = MaintenanceTipo = {}));
var MaintenanceSubTipo;
(function (MaintenanceSubTipo) {
    MaintenanceSubTipo["CUBIERTA"] = "CUBIERTA";
    MaintenanceSubTipo["METALMECANICO_TIENDA"] = "METALMECANICO_TIENDA";
    MaintenanceSubTipo["PUERTA_AUTOMATICA"] = "PUERTA_AUTOMATICA";
    MaintenanceSubTipo["PUNTOS_PAGO"] = "PUNTOS_PAGO";
    MaintenanceSubTipo["REDES_HIDROSANITARIAS"] = "REDES_HIDROSANITARIAS";
    MaintenanceSubTipo["REDES_ELECTRICAS"] = "REDES_ELECTRICAS";
    MaintenanceSubTipo["ESTIBADOR"] = "ESTIBADOR";
    MaintenanceSubTipo["CORTINA_ENROLLABLE"] = "CORTINA_ENROLLABLE";
    MaintenanceSubTipo["OBRA_CIVIL"] = "OBRA_CIVIL";
    MaintenanceSubTipo["METALMECANICA"] = "METALMECANICA";
    MaintenanceSubTipo["ELECTRICA"] = "ELECTRICA";
    MaintenanceSubTipo["EQUIPOS_ESPECIALES"] = "EQUIPOS_ESPECIALES";
})(MaintenanceSubTipo || (exports.MaintenanceSubTipo = MaintenanceSubTipo = {}));
class ResponsableDto {
    nombre;
    cedula;
    telefono;
    selloUrl;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ResponsableDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ResponsableDto.prototype, "cedula", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ResponsableDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ResponsableDto.prototype, "selloUrl", void 0);
class FormDataDto {
    incidencia;
    departamentoTienda;
    ciudadTienda;
    tienda;
    descripcionIncidencia;
    nombreTecnico;
    cedulaTecnico;
    telefonoTecnico;
    tipo;
    subTipo;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormDataDto.prototype, "incidencia", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FormDataDto.prototype, "departamentoTienda", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FormDataDto.prototype, "ciudadTienda", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormDataDto.prototype, "tienda", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FormDataDto.prototype, "descripcionIncidencia", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormDataDto.prototype, "nombreTecnico", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormDataDto.prototype, "cedulaTecnico", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormDataDto.prototype, "telefonoTecnico", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(MaintenanceTipo),
    __metadata("design:type", String)
], FormDataDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(MaintenanceSubTipo),
    __metadata("design:type", String)
], FormDataDto.prototype, "subTipo", void 0);
class FotosDto {
    antes;
    despues;
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FotosDto.prototype, "antes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FotosDto.prototype, "despues", void 0);
class CreateReportDto {
    id;
    tecnicoIp;
    createdAt;
    data;
    checklist;
    extra;
    observaciones;
    fotos;
    firmaTecnicoUrl;
    firmaEncargadoUrl;
    responsable;
    responsablePdfUrl;
    incidenciaRemote;
    encargadoIp;
    encargadoSignedAt;
}
exports.CreateReportDto = CreateReportDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "tecnicoIp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FormDataDto),
    __metadata("design:type", FormDataDto)
], CreateReportDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateReportDto.prototype, "checklist", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateReportDto.prototype, "extra", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "observaciones", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FotosDto),
    __metadata("design:type", FotosDto)
], CreateReportDto.prototype, "fotos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "firmaTecnicoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "firmaEncargadoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ResponsableDto),
    __metadata("design:type", ResponsableDto)
], CreateReportDto.prototype, "responsable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "responsablePdfUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateReportDto.prototype, "incidenciaRemote", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "encargadoIp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "encargadoSignedAt", void 0);
//# sourceMappingURL=create-report.dto.js.map