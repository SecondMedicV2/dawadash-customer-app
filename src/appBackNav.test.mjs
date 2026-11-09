import assert from 'node:assert/strict';
import test from 'node:test';
import { isModalOpen, closeActiveModal, showModal, showExitConfirmation, notify, confirmAction } from './modalController.mjs';
import { linking } from './navigationConfig.mjs';

test('modal controller tracks modal state, handles cancellation and exit confirmation', () => {
  assert.equal(isModalOpen(), false);

  notify('Test Title', 'Test Message');
  assert.equal(isModalOpen(), true);

  // Close active modal
  const closed = closeActiveModal();
  assert.equal(closed, true);
  assert.equal(isModalOpen(), false);

  // Confirm action
  let confirmed = false;
  confirmAction('Confirm', 'Are you sure?', 'Yes', () => { confirmed = true; }, 'No');
  assert.equal(isModalOpen(), true);

  closeActiveModal();
  assert.equal(isModalOpen(), false);

  // Exit confirmation
  let exited = false;
  showExitConfirmation(() => { exited = true; });
  assert.equal(isModalOpen(), true);

  closeActiveModal();
  assert.equal(isModalOpen(), false);
});

test('linking configuration maps all customer tab and stack routes for back navigation', () => {
  assert.ok(linking.prefixes.length >= 2);
  const mainScreens = linking.config.screens.Main.screens;
  assert.equal(mainScreens.Medicines, '');
  assert.equal(mainScreens.Cart, 'cart');
  assert.equal(mainScreens.Orders, 'orders');
  assert.equal(mainScreens.Labs, 'labs');

  const stackScreens = linking.config.screens;
  assert.equal(stackScreens.Scanner, 'scanner');
  assert.equal(stackScreens.Refills, 'refills');
  assert.equal(stackScreens.Login, 'login');
  assert.equal(stackScreens.Otp, 'otp');
});
