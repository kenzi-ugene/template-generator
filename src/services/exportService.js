const fs = require("fs");
const path = require("path");
const libre = require("libreoffice-convert");
const { promisify } = require("util");

const convertAsync = promisify(libre.convert);

function safeFileName(name = "report") {
    return (name || "report")
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[. ]+$/g, "")
        .slice(0, 120) || "report";
}

async function exportArtifacts(docxBuffer, baseName) {
    const outputDir = path.resolve(process.cwd(), "output");
    fs.mkdirSync(outputDir, { recursive: true });

    const fileBase = safeFileName(baseName);
    const docxName = `${fileBase}.docx`;
    const plannedPdfName = `${fileBase}.pdf`;
    const docxPath = path.join(outputDir, docxName);
    const plannedPdfPath = path.join(outputDir, plannedPdfName);

    fs.writeFileSync(docxPath, docxBuffer);

    let pdfName = null;
    let pdfPath = null;
    let warning = null;

    try {
        const pdfBuffer = await convertAsync(docxBuffer, ".pdf", undefined);
        pdfName = plannedPdfName;
        pdfPath = plannedPdfPath;
        fs.writeFileSync(pdfPath, pdfBuffer);
    } catch (error) {
        const missingSoffice = (error.message || "").toLowerCase().includes("soffice");
        if (missingSoffice) {
            warning =
                "DOCX generated, but PDF skipped: LibreOffice (soffice) is not installed or not in PATH.";
        } else {
            throw error;
        }
    }

    return {
        docxName,
        pdfName,
        docxPath,
        pdfPath,
        warning
    };
}

module.exports = {
    exportArtifacts
};
