# Master Template Guide

Place your locked visual template at:

- `templates/letter-master.docx`

Use the provided image `templates/assets/logo-source.png` as a visual reference while recreating the exact document in DOCX.

## Required placeholders

`reference_no`, `letter_date`, `recipient_name`, `clinic_name`, `clinic_address`, `candidate_name`, `candidate_nric`, `job_designation`, `staff_category`, `nature_of_work`, `limit_of_coverage`, `validity_start`, `validity_end`, `validity_weeks`, `contact_emails`, `invoice_email`, `signatory_name`, `generated_at`

Each placeholder should be added in DOCX using Docxtemplater syntax:

- `{placeholder_key}`
