import { brandConfigSource } from './branding/brandConfig.cjs';

export const BRAND = brandConfigSource.load();
export const C = {
  ...BRAND.brand.theme.colors,
  bg: BRAND.brand.theme.colors.background,
  card: BRAND.brand.theme.colors.surface,
};

// Design system type: Manrope for headlines and prices, Plus Jakarta Sans for body and UI.
export const F = {
  h6: 'Manrope_600SemiBold',
  h7: 'Manrope_700Bold',
  h8: 'Manrope_800ExtraBold',
  b4: 'PlusJakartaSans_400Regular',
  b5: 'PlusJakartaSans_500Medium',
  b6: 'PlusJakartaSans_600SemiBold',
  b7: 'PlusJakartaSans_700Bold',
  b8: 'PlusJakartaSans_800ExtraBold',
};

const weightOf = (w) => (w === 'bold' ? 700 : Number.parseInt(w ?? 400, 10) || 400);

/** Picks the family for a flattened text style: large or bold-numeric text uses Manrope. */
export function fontFor(style = {}) {
  const size = style.fontSize ?? 14;
  const w = weightOf(style.fontWeight);
  const headline = size >= 18 || (size >= 16 && w >= 700);
  if (headline) return w >= 800 ? F.h8 : w >= 700 ? F.h7 : F.h6;
  return w >= 800 ? F.b8 : w >= 700 ? F.b7 : w >= 600 ? F.b6 : w >= 500 ? F.b5 : F.b4;
}

// Level 1 card: fine border plus faint ambient shadow; level 2 adds a soft teal glow.
export const shadow = {
  shadowColor: C.black, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
};
export const shadow2 = {
  shadowColor: C.primary, shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 3,
};
