import { Platform } from 'react-native';

// Must match the User-Agent suffix set by android/src/com/dawadash/customer/MainActivity.java.
const ANDROID_SHELL_UA = 'DawaDashAndroid/';

export const ANDROID_APP_DOWNLOAD_PATH = '/download';

/** True when running as the website in a normal browser (not inside the Android APK). */
export function isWebOutsideAndroidApp() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return !String(navigator.userAgent || '').includes(ANDROID_SHELL_UA);
}
