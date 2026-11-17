import { compositionKey } from './medicineComposition.mjs';

export const MEDICINES = [
  { id: 'm1', brand: 'Micro Labs Ltd', pack: 'Strip of 15 Tabs', name: 'Dolo 650mg Tablet', salt: 'Paracetamol 650mg', composition: [{ salt: 'paracetamol', strength: 650, unit: 'mg' }], form: 'tablet', price: 27.5, mrp: 33.5, unit: '₹1.83 / tablet', type: 'Rx', category: 'acute', icon: 'pill' },
  { id: 'm2', brand: 'USV Private Ltd', pack: 'Strip of 20 Tabs', name: 'Glycomet 500 SR', salt: 'Metformin 500mg (Prolonged-Release)', price: 42.8, mrp: 52, unit: '₹2.14 / tablet', type: 'Rx', category: 'chronic', icon: 'pill' },
  { id: 'm3', brand: 'GSK India', pack: 'Strip of 10 Tabs', name: 'Augmentin 625 Duo', salt: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)', price: 178.5, mrp: 223, unit: '₹17.85 / tablet', type: 'Rx', icon: 'pill' },
  { id: 'm4', brand: 'Torrent Pharma', pack: 'Strip of 15 Tabs', name: 'Shelcal 500 Tablet', salt: 'Calcium Carbonate (500mg) + Vit D3 (250 IU)', price: 108.5, mrp: 132, unit: '₹7.23 / tablet', type: 'OTC', icon: 'bone' },
  { id: 'm5', brand: 'Dabur India', pack: '100ml Syrup Bottle', name: 'Dabur Honitus Herbal', salt: 'Tulsi, Mulethi, Banapsha & Honey', price: 95, mrp: 115, unit: '₹0.95 / ml', type: 'Ayurvedic', icon: 'leaf' },
  { id: 'm6', brand: 'GSK India', pack: 'Strip of 10 Tabs', name: 'Crocin 650mg Tablet', salt: 'Paracetamol 650mg', composition: [{ salt: 'paracetamol', strength: 650, unit: 'mg' }], form: 'tablet', price: 24.5, mrp: 29, unit: '₹2.45 / tablet', type: 'Rx', icon: 'pill' },
  { id: 'm7', brand: 'GSK India', pack: 'Strip of 15 Tabs', name: 'Calpol 650mg Tablet', salt: 'Paracetamol 650mg', composition: [{ salt: 'paracetamol', strength: 650, unit: 'mg' }], form: 'tablet', price: 31, mrp: 37, unit: '₹2.07 / tablet', type: 'Rx', icon: 'pill' },
  { id: 'm8', brand: 'Alembic Pharma', pack: 'Strip of 5 Tabs', name: 'Azithral 500mg Tablet', salt: 'Azithromycin (500mg)', price: 119, mrp: 132, unit: '₹23.8 / tablet', type: 'Rx', icon: 'pill', isOutOfStock: true },
];
export const getSubstitutes = (medicine, medicines = MEDICINES) => {
  const key = compositionKey(medicine);
  if (!key) return [];
  return medicines
    .filter((candidate) => candidate.id !== medicine.id && compositionKey(candidate) === key)
    .sort((a, b) => a.price - b.price);
};
export const FILTERS = ['All Items', 'Prescription Drugs (Rx)', 'Chronic Care', 'OTC'];
export const REFILL_PRESCRIPTIONS = [
  { id: 'rx-demo-1', repeat: true, medicineIds: ['m2'] },
  { id: 'rx-demo-2', repeat: false, medicineIds: ['m1'] },
];
export const LAB_TESTS = [
  { id: 'lab-cbc', name: 'Complete Blood Count (CBC)', category: 'Blood test' },
  { id: 'lab-glucose', name: 'Blood Glucose', category: 'Blood test' },
  { id: 'lab-lipid', name: 'Lipid Profile', category: 'Blood test' },
  { id: 'lab-thyroid', name: 'Thyroid Profile (TSH)', category: 'Blood test' },
];
export const LOCALITIES = ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Mahanagar'];
export const inr = (n) =>'₹' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0);
