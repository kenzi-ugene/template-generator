const test = require("node:test");
const assert = require("node:assert/strict");
const { validateInput } = require("../src/services/validationService");

function validPayload() {
    return {
        reference_no: "HRSC/RCRT/Letters/pme-new/2026/jc",
        letter_date: "24 April 2026",
        recipient_name: "Dear Sir / Madam",
        clinic_name: "POLIKLINIK ROZIKIN - AIR BIRU BRANCH",
        clinic_address: "No. 35, Jalan 9/17, Pengkalan 9, Taman Air Biru, 81750 Pasir Gudang, Johor",
        candidate_name: "DARREL AZHARY BIN WILLIAM SHAIFUDDIN",
        candidate_nric: "202120-01-1115",
        job_designation: "Inspector",
        staff_category: "Non-Executive",
        nature_of_work: "Site",
        limit_of_coverage: "MYR 190.00",
        validity_start: "24 April 2026",
        validity_end: "7 May 2026",
        validity_weeks: "2",
        contact_emails: "email1@example.com,email2@example.com",
        invoice_email: "invoice@example.com",
        signatory_name: "Vivian Lim",
        generated_at: "24 April 2026 20:10:00"
    };
}

test("validationService accepts a complete valid payload", () => {
    const result = validateInput(validPayload());
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
});

test("validationService rejects unknown fields to keep template locked", () => {
    const payload = validPayload();
    payload.random_key = "not allowed";
    const result = validateInput(payload);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.join(" ").includes("Unknown fields are not allowed"));
});
