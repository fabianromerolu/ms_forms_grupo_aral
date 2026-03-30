"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypologiesModule = void 0;
const common_1 = require("@nestjs/common");
const typologies_controller_1 = require("./typologies.controller");
const typologies_service_1 = require("./typologies.service");
let TypologiesModule = class TypologiesModule {
};
exports.TypologiesModule = TypologiesModule;
exports.TypologiesModule = TypologiesModule = __decorate([
    (0, common_1.Module)({
        controllers: [typologies_controller_1.TypologiesController],
        providers: [typologies_service_1.TypologiesService],
        exports: [typologies_service_1.TypologiesService],
    })
], TypologiesModule);
//# sourceMappingURL=typologies.module.js.map