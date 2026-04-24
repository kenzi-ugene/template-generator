const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");
const dayjs = require("dayjs");
const schema = require("../schema/placeholders.json");
const EMPTY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lM9rWQAAAABJRU5ErkJggg==";

function templateAbsolutePath() {
    return path.resolve(process.cwd(), schema.lockedTemplatePath);
}

function assertTemplateExists() {
    const absolutePath = templateAbsolutePath();
    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            `Locked template missing at ${schema.lockedTemplatePath}. Add a DOCX template with matching placeholders.`
        );
    }
    return absolutePath;
}

function normalizeMarkerToKey(marker) {
    return marker
        .replace(/^\/\//, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80);
}

function extractRawMarkers(xmlText) {
    const matches = xmlText.match(/\/\/(?:(?!\/\/)[^\r\n<"])+/g) || [];
    return matches
        .map((item) => item.trim().replace(/\s+to$/i, ""))
        .filter(
            (item) =>
                !item.startsWith("//schemas.") &&
                !item.startsWith("//www.") &&
                !item.includes("openxmlformats.org") &&
                !item.includes("microsoft.com")
        );
}

function getTemplateFields() {
    const absolutePath = assertTemplateExists();
    const zip = new PizZip(fs.readFileSync(absolutePath, "binary"));
    const seen = new Set();
    const fields = [];

    for (const fileName of Object.keys(zip.files)) {
        if (!fileName.startsWith("word/") || !fileName.endsWith(".xml")) {
            continue;
        }
        const xmlText = zip.file(fileName).asText();
        const rawMarkers = extractRawMarkers(xmlText);
        for (const marker of rawMarkers) {
            const key = normalizeMarkerToKey(marker);
            if (!key || seen.has(key)) {
                continue;
            }
            seen.add(key);
            fields.push({
                key,
                marker,
                label: marker.replace(/^\/\//, "").trim(),
                required: true,
                maxLength: 300
            });
        }
    }

    return fields;
}

function getDefaultValuesForFields(fields) {
    const now = dayjs();
    const defaults = {};
    for (const field of fields) {
        const lowered = `${field.key} ${field.label}`.toLowerCase();
        if (lowered.includes("date") && lowered.includes("time")) {
            defaults[field.key] = now.format("YYYY-MM-DDTHH:mm");
            continue;
        }
        if (lowered.includes("date") || lowered.includes("today")) {
            if (lowered.includes("validity") && lowered.includes("end")) {
                defaults[field.key] = now.add(14, "day").format("YYYY-MM-DD");
                continue;
            }
            defaults[field.key] = now.format("YYYY-MM-DD");
            continue;
        }
        if (lowered.includes("weeks")) {
            defaults[field.key] = "2";
        }
    }
    return defaults;
}

function isSignatureField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered === "signature" || lowered.includes("signature");
}

function getPlaceholderTag(field) {
    return isSignatureField(field) ? `{%${field.key}}` : `{${field.key}}`;
}

function signatureImageModule() {
    return new ImageModule({
        centered: false,
        getImage(tagValue) {
            if (typeof tagValue !== "string" || tagValue.trim().length === 0) {
                return Buffer.from(EMPTY_PNG_BASE64, "base64");
            }
            const split = tagValue.split(",");
            const base64 = split.length > 1 ? split[1] : split[0];
            return Buffer.from(base64, "base64");
        },
        getSize() {
            return [140, 50];
        }
    });
}

function mergeTemplate(data) {
    const absolutePath = assertTemplateExists();
    const zip = new PizZip(fs.readFileSync(absolutePath, "binary"));

    const fields = getTemplateFields();
    for (const fileName of Object.keys(zip.files)) {
        if (!fileName.startsWith("word/") || !fileName.endsWith(".xml")) {
            continue;
        }
        let xmlText = zip.file(fileName).asText();
        for (const field of fields) {
            xmlText = xmlText.split(field.marker).join(getPlaceholderTag(field));
        }
        zip.file(fileName, xmlText);
    }

    const doc = new Docxtemplater(zip, {
        modules: [signatureImageModule()],
        paragraphLoop: true,
        linebreaks: true
    });

    doc.render(data);
    return doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE"
    });
}

module.exports = {
    mergeTemplate,
    assertTemplateExists,
    getTemplateFields,
    getDefaultValuesForFields
};
