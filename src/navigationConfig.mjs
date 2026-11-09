import { brandConfigSource } from './branding/brandConfig.cjs';

const BRAND = brandConfigSource.load();

export const linking = {
  prefixes: [`https://${BRAND.brand.id}-customer.web.app`, 'http://localhost:5056', `${BRAND.brand.id}://`],
  config: {
    screens: {
      Main: {
        screens: {
          Medicines: '',
          Cart: 'cart',
          Orders: 'orders',
          Labs: 'labs',
        },
      },
      Scanner: 'scanner',
      Refills: 'refills',
      Profile: 'profile',
      Login: 'login',
      Otp: 'otp',
    },
  },
};
