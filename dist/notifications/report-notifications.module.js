"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportNotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const report_notifications_service_1 = require("./report-notifications.service");
let ReportNotificationsModule = class ReportNotificationsModule {
};
exports.ReportNotificationsModule = ReportNotificationsModule;
exports.ReportNotificationsModule = ReportNotificationsModule = __decorate([
    (0, common_1.Module)({
        providers: [report_notifications_service_1.ReportNotificationsService],
        exports: [report_notifications_service_1.ReportNotificationsService],
    })
], ReportNotificationsModule);
//# sourceMappingURL=report-notifications.module.js.map