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
var IncidentsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let IncidentsScheduler = IncidentsScheduler_1 = class IncidentsScheduler {
    prisma;
    notifier;
    logger = new common_1.Logger(IncidentsScheduler_1.name);
    constructor(prisma, notifier) {
        this.prisma = prisma;
        this.notifier = notifier;
    }
    async checkExpiredIncidents() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const expired = await this.prisma.incidencia.findMany({
            where: {
                status: { notIn: ['CERRADA'] },
                isDisabled: false,
                expirationAt: { gte: oneHourAgo, lte: now },
            },
        });
        if (expired.length === 0)
            return;
        this.logger.log(`Found ${expired.length} newly-expired incident(s), notifying...`);
        for (const incidencia of expired) {
            try {
                await this.notifier.notifyIncidentExpired(incidencia);
            }
            catch (err) {
                this.logger.error(`Failed to notify expired incident ${incidencia.incidentNumber}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
};
exports.IncidentsScheduler = IncidentsScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IncidentsScheduler.prototype, "checkExpiredIncidents", null);
exports.IncidentsScheduler = IncidentsScheduler = IncidentsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.ReportNotificationsService])
], IncidentsScheduler);
//# sourceMappingURL=incidents.scheduler.js.map