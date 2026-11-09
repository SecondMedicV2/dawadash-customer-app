import assert from 'node:assert/strict';
import test from 'node:test';
import { getSubstitutes, MEDICINES } from './src/data.js';

test('substitutes match salt, strength, and form, then sort by price', () => {
  const dolo = MEDICINES.find((medicine) => medicine.id === 'm1');
  const candidates = [
    ...MEDICINES,
    { ...dolo, id: 'same-salts-different-order', price: 26, composition: [...dolo.composition].reverse() },
    { ...dolo, id: 'wrong-strength', composition: [{ ...dolo.composition[0], strength: 500 }] },
    { ...dolo, id: 'wrong-form', form: 'syrup' },
  ];

  assert.deepEqual(
    getSubstitutes(dolo, candidates).map((medicine) => medicine.id),
    ['m6', 'same-salts-different-order', 'm7'],
  );
});