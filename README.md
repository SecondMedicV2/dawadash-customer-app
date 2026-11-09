# DawaDash Customer Mobile App

Official customer application for **DawaDash** — neighbourhood pharmacy care and 30–45 minute medicine delivery across Lucknow.

---

## Brand Identity & Icon
- **App Logo**: `assets/AppLogo.png`
- **Launcher Icons**: `assets/icon.png`, `android/res/mipmap-*/ic_launcher.png`, `ic_launcher_round.png`
- **Splash Screen**: `assets/splash.png`
- **Brand Colors**: Teal (`#0D9488`), Primary Dark (`#00685F`), Mint (`#CCFBF1`), Background (`#F8FAFC`)

---

## App Features
1. **Medicine Catalog & Salt Composition**: Search 3,000+ medicines, view salt composition, strength, and find verified generic substitutes (e.g. Paracetamol 650 mg equivalents).
2. **Prescription Scanner & Upload**: Take a camera photo or upload an image/PDF. A registered Lucknow pharmacist verifies it before dispatch.
3. **Cart & Lucknow Neighbourhood Delivery**: Select delivery locality (Gomti Nagar, Hazratganj, Aliganj, Indira Nagar, Alambagh). Free delivery over ₹299.
4. **Live Order Tracking**: Real-time 5-stage tracking (Order received -> Pharmacist verified -> Packing nearby -> Out for delivery -> Delivered) with ETA.
5. **Monthly Auto-Refills & Diagnostic Lab Bookings**: Book diagnostic tests (CBC, Lipid profile, HbA1c, etc.) with certified Lucknow labs.

---

## Android APK File

The release APK is compiled and ready for direct installation on Android phones:

| Attribute | Details |
|---|---|
| **File Path** | `dist/DawaDash-Customer.apk` (and at workspace root `DawaDash-Customer.apk`) |
| **Package ID** | `com.dawadash.customer` |
| **Version** | `1.0.0` (Build 1) |
| **File Size** | `1.35 MB` |
| **Target OS** | Android 8.0 to Android 15 (API 26–35) |
| **Signature** | Verified with APK Signature Schemes V2 and V3 |
| **App Icon** | Built with `AppLogo.png` |

### How to Download & Install
1. **Direct Download Page**:
   Run the download server:
   ```bash
   node serve-apk.mjs
   ```
   Open `http://localhost:8080/` in any browser or on your phone connected to the same Wi-Fi.
2. **Direct APK File**:
   Copy or send `dist/DawaDash-Customer.apk` to any Android phone and tap Install.

### Rebuilding the APK
If you modify native resources or assets, re-compile the APK anytime:
```powershell
powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
```

---

## Running with React Native / Expo
```bash
# Start Expo development server
npm start

# Run in Web browser
npm run web

# Run on connected Android device / emulator
npm run android
```

## Web hosting (Firebase)

The customer app is also served as a web app at **https://dawadash-customer.web.app** (Firebase project `dawadash-customer`).

| What | How |
|------|-----|
| Build locally | `npm run build:web` → `web-dist/` |
| Deploy manually | `npm run deploy:web` (needs `firebase login`) |
| Auto-deploy | Push to `main` → `.github/workflows/firebase-hosting-merge.yml` |
| PR previews | Every PR gets a 7-day preview URL → `firebase-hosting-pull-request.yml` |
| Roll back | Firebase console → Hosting → Release history → *Rollback*, or `firebase hosting:clone dawadash-customer:live@<version> dawadash-customer:live` |

CI deploys without any stored key: GitHub Actions signs in to Google through Workload Identity Federation (pool `github`, provider `github-oidc`), which only trusts this repo (ID `1450964627`) and acts as the `github-action-1450964627` service account (Firebase Hosting roles only). No repo secrets are needed.
