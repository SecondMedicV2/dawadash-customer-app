/** @param {(strength: number | string) => number | string} [strengthKey] */
export function compositionKey(medicine, strengthKey = Number) {
  if (!medicine.form || !medicine.composition?.length) return null;
  const salts = medicine.composition.map(({ salt, strength, unit }) =>
    JSON.stringify([salt.trim().toLowerCase(), strengthKey(strength), unit.trim().toLowerCase()]),
  ).sort();
  return JSON.stringify([medicine.form.trim().toLowerCase(), salts]);
}
