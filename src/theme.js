import { brandConfigSource } from './branding/brandConfig.cjs';

export const BRAND = brandConfigSource.load();
export const C = {
  ...BRAND.brand.theme.colors,
  bg: BRAND.brand.theme.colors.background,
  card: BRAND.brand.theme.colors.surface,
};
export const shadow = {
  shadowColor: C.black, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
};
