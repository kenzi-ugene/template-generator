const schema = require("../schema/placeholders.json");

function allowedFieldMap() {
    return new Map(schema.editableFields.map((field) => [field.key, field]));
}

function normalizeInput(rawInput = {}) {
    const normalized = {};
    for (const [key, value] of Object.entries(rawInput)) {
        normalized[key] = typeof value === "string" ? value.trim() : "";
    }
    return normalized;
}

function countNewLines(value) {
    return (value.match(/\n/g) || []).length;
}

function validateInput(rawInput = {}) {
    const errors = [];
    const map = allowedFieldMap();
    const normalized = normalizeInput(rawInput);

    if (!schema.lockedRules.allowUnknownFields) {
        const unknownKeys = Object.keys(normalized).filter((key) => !map.has(key));
        if (unknownKeys.length > 0) {
            errors.push(`Unknown fields are not allowed: ${unknownKeys.join(", ")}`);
        }
    }

    for (const field of schema.editableFields) {
        const value = normalized[field.key] || "";
        if (field.required && value.length === 0) {
            errors.push(`${field.label} is required.`);
            continue;
        }
        if (value.length > field.maxLength) {
            errors.push(`${field.label} exceeds max length (${field.maxLength}).`);
        }
        if (countNewLines(value) > schema.lockedRules.maxNewLinesPerField) {
            errors.push(
                `${field.label} exceeds allowed line breaks (${schema.lockedRules.maxNewLinesPerField}).`
            );
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: Object.fromEntries(
            schema.editableFields.map((field) => [field.key, normalized[field.key] || ""])
        )
    };
}

module.exports = {
    validateInput
};
