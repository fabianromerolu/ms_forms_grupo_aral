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
exports.CatalogActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const catalog_activities_service_1 = require("./catalog-activities.service");
const list_catalog_activities_query_dto_1 = require("./dto/list-catalog-activities.query.dto");
const update_catalog_activity_dto_1 = require("./dto/update-catalog-activity.dto");
let CatalogActivitiesController = class CatalogActivitiesController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(q) {
        return this.service.findAll(q.page ? Number(q.page) : 1, q.limit ? Number(q.limit) : 50, q.q, q.specialty, q.chapter);
    }
    getSpecialties() {
        return this.service.getSpecialties();
    }
    getChapters(specialty) {
        return this.service.getChapters(specialty);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
};
exports.CatalogActivitiesController = CatalogActivitiesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_catalog_activities_query_dto_1.ListCatalogActivitiesQueryDto]),
    __metadata("design:returntype", void 0)
], CatalogActivitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('specialties'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogActivitiesController.prototype, "getSpecialties", null);
__decorate([
    (0, common_1.Get)('chapters'),
    __param(0, (0, common_1.Query)('specialty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogActivitiesController.prototype, "getChapters", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_catalog_activity_dto_1.UpdateCatalogActivityDto]),
    __metadata("design:returntype", void 0)
], CatalogActivitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogActivitiesController.prototype, "findOne", null);
exports.CatalogActivitiesController = CatalogActivitiesController = __decorate([
    (0, swagger_1.ApiTags)('catalog-activities'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('catalog-activities'),
    __metadata("design:paramtypes", [catalog_activities_service_1.CatalogActivitiesService])
], CatalogActivitiesController);
//# sourceMappingURL=catalog-activities.controller.js.map