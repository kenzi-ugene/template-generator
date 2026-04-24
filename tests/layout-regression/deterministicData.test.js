const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

function stableHash(value) {
    return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

test("layout regression guard produces deterministic hash for same payload", () => {
    const payload = {
        reference_no: "ABC-123",
        letter_date: "24 April 2026",
        candidate_name: "John Doe"
    };

    const hashOne = stableHash(payload);
    const hashTwo = stableHash(payload);

    assert.equal(hashOne, hashTwo);
});
