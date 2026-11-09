import assert from 'node:assert/strict';
import test from 'node:test';
import { getSubstitutes, LAB_TESTS, MEDICINES, REFILL_PRESCRIPTIONS } from './data.js';

test('medicine alternatives match the same composition and dosage form', () => {
  const medicine = MEDICINES.find((item) => item.id === 'm1');
  assert.deepEqual(getSubstitutes(medicine).map((item) => item.id), ['m6', 'm7']);
  assert.deepEqual(getSubstitutes(MEDICINES.find((item) => item.id === 'm2')), []);
});

test('demo refill records and lab tests reference unique catalog identifiers', () => {
  assert.equal(new Set(LAB_TESTS.map((item) => item.id)).size, LAB_TESTS.length);
  for (const prescription of REFILL_PRESCRIPTIONS) {
    for (const medicineId of prescription.medicineIds) {
      assert.ok(MEDICINES.some((medicine) => medicine.id === medicineId), `unknown medicine: ${medicineId}`);
    }
  }
});
