"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSearchText = buildSearchText;
function buildSearchText(parts) {
    return parts
        .map((p) => (p ?? '').trim())
        .filter(Boolean)
        .join(' | ')
        .toLowerCase();
}
//# sourceMappingURL=search-text.util.js.map