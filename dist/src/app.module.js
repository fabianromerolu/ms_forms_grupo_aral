"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const reports_module_1 = require("./reports/reports.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const incidents_module_1 = require("./incidents/incidents.module");
const quotes_module_1 = require("./quotes/quotes.module");
const requests_module_1 = require("./requests/requests.module");
const stores_module_1 = require("./stores/stores.module");
const typologies_module_1 = require("./typologies/typologies.module");
const activities_module_1 = require("./activities/activities.module");
const catalog_activities_module_1 = require("./catalog-activities/catalog-activities.module");
const metrics_module_1 = require("./metrics/metrics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            reports_module_1.ReportsModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            incidents_module_1.IncidentsModule,
            quotes_module_1.QuotesModule,
            requests_module_1.RequestsModule,
            stores_module_1.StoresModule,
            typologies_module_1.TypologiesModule,
            activities_module_1.ActivitiesModule,
            catalog_activities_module_1.CatalogActivitiesModule,
            metrics_module_1.MetricsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map