const express = require("express");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");
const generateRoute = require("./routes/generate");
const schema = require("./schema/placeholders.json");
const {
    assertTemplateExists,
    getTemplateFields,
    getDefaultValuesForFields
} = require("./services/templateMergeService");

const app = express();
const port = process.env.PORT || 3000;
const clientDistPath = path.resolve(process.cwd(), "client-dist");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/download", express.static(path.resolve(process.cwd(), "output")));
app.use(express.static(clientDistPath));

app.get("/api/schema", (_req, res) => {
    const editableFields = getTemplateFields();
    res.json({
        templateVersion: schema.templateVersion,
        lockedTemplatePath: schema.lockedTemplatePath,
        editableFields
    });
});

app.get("/api/defaults", (_req, res) => {
    const fields = getTemplateFields();
    const defaults = getDefaultValuesForFields(fields);
    const now = dayjs();
    res.json({
        ...defaults,
        letter_date: now.format("D MMMM YYYY"),
        generated_at: now.format("D MMMM YYYY HH:mm:ss")
    });
});

app.use("/api/generate", generateRoute);

app.get("/", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
});

app.get("/health", (_req, res) => {
    const templatePath = path.resolve(process.cwd(), schema.lockedTemplatePath);
    res.json({
        status: "ok",
        templateExists: fs.existsSync(templatePath)
    });
});

app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/download")) {
        return next();
    }
    return res.sendFile(path.join(clientDistPath, "index.html"));
});

try {
    assertTemplateExists();
    console.log(`Using locked template: ${schema.lockedTemplatePath}`);
} catch (error) {
    console.warn(error.message);
}

app.listen(port, () => {
    console.log(`Letter template generator running at http://localhost:${port}`);
});
