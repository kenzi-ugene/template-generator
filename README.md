# Letter Template Generator

This project generates a locked-format pre-employment letter from editable placeholders and exports both DOCX and PDF.

## What is locked

- Logo and static visual layout
- Paragraph structure, spacing, and typography
- Non-placeholder text in the master template

Only placeholders listed in `src/schema/placeholders.json` are editable.

## Setup

1. Install dependencies:
   - `npm install`
2. Put your master template file at:
   - `templates/letter-master.docx`
3. Build React frontend:
   - `npm run client:build`
4. Start server:
   - `npm run dev`
5. Open:
   - `http://localhost:3000`

## React frontend

- Source: `client/src/App.jsx`
- Uses MUI `DatePicker` for year-month-day fields.
- Editable fields are fetched from `/api/schema` and defaults from `/api/defaults`.

## Template Authoring Rules

- Use a single master DOCX (`templates/letter-master.docx`) as source-of-truth.
- Insert placeholders as Docxtemplater tags, for example:
  - `{reference_no}`
  - `{letter_date}`
  - `{candidate_name}`
  - `{candidate_nric}`
  - `{job_designation}`
  - `{generated_at}`
- Do not edit static content during generation; users can only edit schema-defined fields.

## Date and Time behavior

- `letter_date` and `generated_at` default from `now()` via `/api/defaults`.
- Users can override before generating.

## Outputs

- Generated files are saved in `output/`.
- API returns downloadable links:
  - `/download/<file>.docx`
  - `/download/<file>.pdf`
- If LibreOffice is missing, DOCX is still generated and PDF is skipped with a warning.

## Enable PDF Export (Windows)

`libreoffice-convert` requires LibreOffice `soffice` binary.

1. Install LibreOffice from [https://www.libreoffice.org/download/download-libreoffice/](https://www.libreoffice.org/download/download-libreoffice/)
2. Add this path to your Windows `PATH`:
   - `C:\Program Files\LibreOffice\program`
3. Restart terminal/IDE and run the app again.
4. Verify with:
   - `soffice --version`

## API

- `GET /api/schema` -> editable placeholder schema
- `GET /api/defaults` -> now() default values
- `POST /api/generate` -> generate artifacts
- `GET /health` -> health and template existence

## Validation and consistency controls

- Unknown fields are rejected.
- Max field lengths are enforced.
- Line breaks are capped per field to reduce overflow risks.
- Deterministic generation path uses one template source and one conversion engine.

## Test

- Run tests:
  - `npm test`
