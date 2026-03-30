"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateResponse = paginateResponse;
function paginateResponse(items, total, page, limit) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
        },
        items,
    };
}
//# sourceMappingURL=pagination.util.js.map