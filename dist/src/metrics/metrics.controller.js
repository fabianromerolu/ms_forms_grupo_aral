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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const metrics_service_1 = require("./metrics.service");
let MetricsController = class MetricsController {
    service;
    constructor(service) {
        this.service = service;
    }
    getOverview(from) {
        return this.service.getOverview(from);
    }
    getIncidenciasByStatus() {
        return this.service.getIncidenciasByStatus();
    }
    getIncidenciasByType() {
        return this.service.getIncidenciasByType();
    }
    getSolicitudesByStatus() {
        return this.service.getSolicitudesByStatus();
    }
    getReportsByType(from) {
        return this.service.getReportsByType(from);
    }
    getIncidenciasByRegional() {
        return this.service.getIncidenciasByRegional();
    }
    getTimeSeries(days, from) {
        return this.service.getTimeSeries(Number(days) || 30, from);
    }
    getStoreMetrics(storeCode, year, month) {
        const now = new Date();
        return this.service.getStoreMetrics(storeCode, Number(year) || now.getFullYear(), Number(month) || now.getMonth() + 1);
    }
    getRegionalMetrics(regional, year, month) {
        const now = new Date();
        return this.service.getRegionalMetrics(regional, Number(year) || now.getFullYear(), Number(month) || now.getMonth() + 1);
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Filtrar reportes desde esta fecha ISO (opcional)' }),
    __param(0, (0, common_1.Query)('from')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('incidencias/by-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getIncidenciasByStatus", null);
__decorate([
    (0, common_1.Get)('incidencias/by-type'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getIncidenciasByType", null);
__decorate([
    (0, common_1.Get)('solicitudes/by-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getSolicitudesByStatus", null);
__decorate([
    (0, common_1.Get)('reports/by-type'),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Filtrar desde esta fecha ISO (opcional)' }),
    __param(0, (0, common_1.Query)('from')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getReportsByType", null);
__decorate([
    (0, common_1.Get)('incidencias/by-regional'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getIncidenciasByRegional", null);
__decorate([
    (0, common_1.Get)('time-series'),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Últimos N días (default 30)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Piso mínimo de fecha ISO para reportes (opcional)' }),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('from')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getTimeSeries", null);
__decorate([
    (0, common_1.Get)('store'),
    (0, swagger_1.ApiQuery)({ name: 'storeCode', required: true, description: 'Código de tienda' }),
    (0, swagger_1.ApiQuery)({ name: 'year', required: false, description: 'Año (default año actual)' }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false, description: 'Mes 1-12 (default mes actual)' }),
    __param(0, (0, common_1.Query)('storeCode')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getStoreMetrics", null);
__decorate([
    (0, common_1.Get)('regional'),
    (0, swagger_1.ApiQuery)({ name: 'regional', required: true, description: 'Nombre de la regional' }),
    (0, swagger_1.ApiQuery)({ name: 'year', required: false, description: 'Año (default año actual)' }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false, description: 'Mes 1-12 (default mes actual)' }),
    __param(0, (0, common_1.Query)('regional')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getRegionalMetrics", null);
exports.MetricsController = MetricsController = __decorate([
    (0, swagger_1.ApiTags)('metrics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COORDINADOR, client_1.UserRole.OPERARIO, client_1.UserRole.SUPERVISOR),
    (0, common_1.Controller)('metrics'),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsController);
//# sourceMappingURL=metrics.controller.js.map