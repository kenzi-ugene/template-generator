const express = require("express");
const dayjs = require("dayjs");
const { mergeTemplate, getTemplateFields, getDefaultValuesForFields } = require("../services/templateMergeService");
const { exportArtifacts } = require("../services/exportService");

const router = express.Router();

function formatValueForTemplate(field, value) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    if (!value) {
        return value;
    }

    if (lowered.includes("date") && lowered.includes("time")) {
        const parsed = dayjs(value);
        return parsed.isValid() ? parsed.format("D MMMM YYYY HH:mm:ss") : value;
    }
    if (lowered.includes("date") || lowered.includes("today")) {
        const parsed = dayjs(value);
        return parsed.isValid() ? parsed.format("D MMMM YYYY") : value;
    }

    return value;
}

router.post("/", async (req, res) => {
    try {
        const fields = getTemplateFields();
        const defaults = getDefaultValuesForFields(fields);
        const payload = {};

        for (const field of fields) {
            const rawValue = req.body[field.key];
            const pickedValue = typeof rawValue === "string" && rawValue.trim().length > 0
                ? rawValue.trim()
                : (defaults[field.key] || "");
            payload[field.key] = formatValueForTemplate(field, pickedValue);
        }

        const docxBuffer = mergeTemplate(payload);
        const staffName = payload.name_of_staff || payload.candidate_name || "STAFF_NAME";
        const todayStamp = dayjs().format("YYYYMMDD");
        const baseName = `GL - ${staffName} - TODAY'S DATE (${todayStamp})`;
        const files = await exportArtifacts(docxBuffer, baseName);

        return res.status(201).json({
            message: "Letter generated successfully.",
            warning: files.warning,
            files: {
                docx: `/download/${files.docxName}`,
                pdf: files.pdfName ? `/download/${files.pdfName}` : null
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Generation failed",
            error: error.message
        });
    }
});

module.exports = router;
