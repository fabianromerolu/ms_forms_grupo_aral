"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueNumber = generateUniqueNumber;
function generateUniqueNumber(prefix) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
}
//# sourceMappingURL=generate-number.util.js.map