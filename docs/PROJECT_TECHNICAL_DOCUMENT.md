# Project Technical Document

## 1) Project Overview

`template-generator` is a locked-format letter generation system that:

- Uses a master DOCX template (`templates/letter-master.docx`) as source of truth.
- Exposes editable placeholders to users through a React frontend.
- Generates DOCX output and optional PDF output.
- Prevents users from editing static template structure/content.

The system is designed for deterministic output: the same template engine and the same template source are used for every generation run.

## 2) High-Level Architecture

### Backend

- Runtime: Node.js (CommonJS)
- Framework: Express
- Entry point: `src/server.js`
- Core route: `src/routes/generate.js`
- Core services:
  - `src/services/templateMergeService.js`
  - `src/services/exportService.js`

### Frontend

- Stack: React + Vite + MUI
- Source: `client/src/App.jsx`
- Build output served by backend from `client-dist/`

### Template and Output

- Master template: `templates/letter-master.docx`
- Placeholder schema metadata: `src/schema/placeholders.json`
- Generated artifacts: `output/*.docx` and `output/*.pdf`
- Download route: `/download/<filename>`

## 3) Request and Data Flow

1. Browser loads SPA from `/`.
2. Frontend calls `GET /api/schema` to fetch editable field definitions.
3. Frontend calls `GET /api/defaults` to prefill date/time and default values.
4. User submits form to `POST /api/generate`.
5. Backend merges payload into template and writes DOCX.
6. Backend attempts DOCX -> PDF conversion using LibreOffice.
7. Backend returns downloadable links for generated files.

## 4) API Contract

### `GET /api/schema`

Returns:

- `templateVersion`
- `lockedTemplatePath`
- `editableFields` (extracted field list from DOCX markers)

### `GET /api/defaults`

Returns default values computed from field metadata and current time:

- `letter_date` as `D MMMM YYYY`
- `generated_at` as `D MMMM YYYY HH:mm:ss`
- Additional default values for date/weeks-based fields

### `POST /api/generate`

Behavior:

- Accepts editable field values.
- Trims string values and applies defaults for missing values.
- Applies date formatting rules for date/datetime-like fields.
- Generates files via `exportArtifacts`.

Response:

- `files.docx`
- `files.pdf` (nullable if PDF conversion is skipped)
- `warning` (nullable, usually when LibreOffice missing)

### `POST /api/generate/import`

Behavior:

- Accepts DOCX upload (`multipart/form-data`, field: `file`).
- Reads embedded metadata payload (`template-generator/payload.json`).

Response:

- Imported values if metadata exists.
- 400 if file missing or metadata not present.

### `GET /health`

Returns:

- `status: "ok"`
- `templateExists` boolean based on locked template path.

## 5) Template Engine Behavior

Core logic lives in `src/services/templateMergeService.js`.

### Marker discovery

- Scans `word/*.xml` in DOCX ZIP.
- Extracts marker-like content starting with `//`.
- Filters out schema/namespace noise.
- Normalizes markers into stable keys.

### Rendering

- Converts markers to Docxtemplater tags (`{key}` or image tag `{%key}` for signatures).
- Renders payload with Docxtemplater.
- Supports line breaks and paragraph loops.

### Signature handling

- Signature fields are identified by label/key containing `signature`.
- Image module decodes base64 signature input.
- Falls back to 1x1 empty PNG when signature value is empty.

### Attachment page break rule

- If `ATTACHMENT` appears in main document XML, system enforces a page break before it.

### Embedded generation metadata

- Generated DOCX stores payload JSON at `template-generator/payload.json`.
- Enables later import/re-edit flow through `/api/generate/import`.

## 6) Export Behavior

Implemented in `src/services/exportService.js`.

- Always writes DOCX to `output/`.
- Attempts PDF conversion using `libreoffice-convert`.
- If `soffice` is missing in PATH:
  - DOCX still succeeds.
  - PDF is skipped.
  - Warning is returned in API response.

Filename safety:

- Invalid filename characters are sanitized.
- Filename length is capped.

## 7) Validation and Safety Controls

- Editable fields are derived from controlled template markers.
- Unknown arbitrary fields are not part of generation loop.
- Max field lengths are defined in extracted field definitions.
- Upload endpoint size capped to 20 MB via multer.
- Fallback SPA route excludes `/api` and `/download` paths.

## 8) Build, Run, and Test

From `package.json`:

- Install: `npm install`
- Build frontend: `npm run client:build`
- Dev run: `npm run dev`
- Prod run: `npm start`
- Test: `npm test`

Default runtime port: `3000` (override with `PORT`).

## 9) Operational Dependencies

- Node.js + npm
- LibreOffice (`soffice`) for PDF conversion
- Write access to `output/`
- Presence of `templates/letter-master.docx`

## 10) Known Operational Risks

- If `templates/letter-master.docx` is missing, generation cannot work.
- If `soffice` is unavailable, PDF will not be produced.
- If output directory grows indefinitely, disk usage may become an issue.
- Template marker changes can affect field extraction behavior.

## 11) Recommended Maintenance

- Periodically clean old files in `output/`.
- Back up the master template and schema files.
- Keep Node.js and dependencies patched.
- Add monitoring around `/health`, process uptime, and disk usage.
