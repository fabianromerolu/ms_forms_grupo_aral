"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeText = safeText;
exports.uniqueStrings = uniqueStrings;
function safeText(value) {
    if (value == null)
        return '';
    if (typeof value === 'string')
        return value.trim();
    if (typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint') {
        return String(value);
    }
    if (value instanceof Date)
        return value.toISOString();
    if (Array.isArray(value)) {
        return value
            .map((item) => safeText(item))
            .filter(Boolean)
            .join(', ');
    }
    return '';
}
function uniqueStrings(values) {
    const out = [];
    const seen = new Set();
    for (const value of values) {
        const text = safeText(value).trim();
        if (!text || seen.has(text))
            continue;
        seen.add(text);
        out.push(text);
    }
    return out;
}
//# sourceMappingURL=text.utils.js.map