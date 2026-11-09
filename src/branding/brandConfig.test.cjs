const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { ACTIVE_BRAND_CONFIG, brandChangeGovernance, brandConfigSource } = require('./brandConfig.cjs');
const configDir = path.dirname(require.resolve('./brandConfig.cjs'));

test('only DawaDash is active, Second Medic stays JV-governed, and config is immutable', () => {
  const config = brandConfigSource.load();
  assert.equal(config, ACTIVE_BRAND_CONFIG);
  assert.equal(brandConfigSource.load('dawadash'), config);
  assert.equal(config.brand.name, 'DawaDash');
  assert.equal(config.governance.changeTrigger, 'approved-deployment');
  const secondMedic = brandConfigSource.load('second-medic');
  assert.notEqual(secondMedic, config);
  assert.equal(secondMedic.governance.changeRequiresMutualAgreement, true);
  assert.equal(Object.isFrozen(config), true);
  assert.equal(Object.isFrozen(config.governance), true);
  assert.equal(Object.isFrozen(config.brand.theme.colors), true);
  assert.equal(config.brand.theme.statusBarStyle, 'dark');
  assert.equal(Object.keys(config.brand.theme.colors).length > 0, true);
  assert.equal(Object.keys(config.brand.disclaimers).length > 0, true);
});

test('build-time brand selection rejects unconfigured variants', () => {
  assert.throws(() => brandConfigSource.load('unconfigured-brand'), /Unknown build-time brand/);
});

test('brand changes cannot be triggered without the JV approval workflow', async () => {
  await assert.rejects(brandChangeGovernance.requestChange(), /mutual JV agreement/);
});

test('feature UI reads branding and disclaimer copy from configuration', () => {
  const files = [
    path.join(configDir, '..', '..', 'App.js'),
    ...['Auth.js', 'Catalog.js', 'Cart.js', 'Refills.js', 'Labs.js', 'Orders.js', 'Misc.js']
      .map((file) => path.join(configDir, '..', 'screens', file)),
    path.join(configDir, '..', 'data.js'),
    path.join(configDir, '..', 'ui.js'),
    path.join(configDir, '..', 'theme.js'),
  ];
  const sources = files.map((file) => fs.readFileSync(file, 'utf8'));
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const source of sources) {
    assert.doesNotMatch(source, /DawaDash|Second Medic|#[0-9a-f]{3,8}\b/i);
  }
  // Single-word copy ("Subtotal", "Prescription") is ordinary UI vocabulary and collides with
  // identifiers like `subtotal`; only multi-word disclaimer copy is distinctive enough to detect.
  const distinctive = Object.values(ACTIVE_BRAND_CONFIG.brand.disclaimers).filter((value) => /\s/.test(value.trim()));
  assert.ok(distinctive.length > 0);
  for (const disclaimer of distinctive) {
    const literal = new RegExp(`\\b${escapeRegExp(disclaimer)}\\b`, 'i');
    assert.ok(!sources.some((source) => literal.test(source)), `feature code contains disclaimer: ${disclaimer}`);
  }
});

test('native Expo identity, icon, and splash all come from the active brand config', () => {
  const appConfig = require('../../app.config.js')({ config: { ios: {}, android: {} } });
  const { brand } = ACTIVE_BRAND_CONFIG;
  assert.equal(appConfig.name, brand.name);
  assert.equal(appConfig.slug, brand.id);
  assert.equal(appConfig.icon, brand.logo.appIcon);
  assert.equal(appConfig.ios.icon, brand.logo.appIcon);
  assert.equal(appConfig.android.adaptiveIcon.foregroundImage, brand.logo.adaptiveIconForeground);
  assert.equal(appConfig.splash.image, brand.logo.splashLogo);
});

test('status bar appearance and remaining demo disclosures come from brand config', () => {
  const app = fs.readFileSync(path.join(configDir, '..', '..', 'App.js'), 'utf8');
  const auth = fs.readFileSync(path.join(configDir, '..', 'screens', 'Auth.js'), 'utf8');
  const refills = fs.readFileSync(path.join(configDir, '..', 'screens', 'Refills.js'), 'utf8');
  assert.match(app, /StatusBar style=\{BRAND\.brand\.theme\.statusBarStyle\}/);
  assert.doesNotMatch(app, /StatusBar style="(?:light|dark)"/);
  for (const disclaimer of [
    'demoSignInAction',
    'demoOtpTitle',
    'demoOtpAction',
    'demoOtpNotice',
    'refillRecordsTitle',
    'refillSamplePrescription',
    'refillRepeatPrescription',
    'refillRecordDate',
  ]) {
    assert.ok(ACTIVE_BRAND_CONFIG.brand.disclaimers[disclaimer]);
  }
  assert.match(auth, /BRAND\.brand\.disclaimers\.demoSignInAction/);
  assert.match(auth, /BRAND\.brand\.disclaimers\.demoOtpTitle/);
  assert.match(auth, /BRAND\.brand\.disclaimers\.demoOtpAction/);
  assert.match(auth, /BRAND\.brand\.disclaimers\.demoOtpNotice/);
  assert.match(refills, /BRAND\.brand\.disclaimers\.refillRecordsTitle/);
  assert.match(refills, /BRAND\.brand\.disclaimers\.refillRepeatPrescription/);
  assert.match(refills, /BRAND\.brand\.disclaimers\.refillSamplePrescription/);
  assert.match(refills, /BRAND\.brand\.disclaimers\.refillRecordDate/);
});
