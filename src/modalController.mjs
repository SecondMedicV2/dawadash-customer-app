import { brandConfigSource } from './branding/brandConfig.cjs';

const BRAND = brandConfigSource.load();

let modalSubscriber = null;
let activeModalState = null;

export function isModalOpen() {
  return activeModalState !== null;
}

export function closeActiveModal() {
  if (activeModalState) {
    if (typeof activeModalState.onCancel === 'function') {
      activeModalState.onCancel();
    }
    activeModalState = null;
    if (modalSubscriber) modalSubscriber(null);
    return true;
  }
  return false;
}

export function registerModalSubscriber(fn) {
  modalSubscriber = fn;
  if (activeModalState && fn) fn(activeModalState);
  return () => {
    modalSubscriber = null;
  };
}

export function showModal(config) {
  activeModalState = config;
  if (modalSubscriber) modalSubscriber(config);
}

export function notify(title, message) {
  showModal({
    title,
    message,
    confirmLabel: 'OK',
    icon: 'information-outline',
  });
}

export function confirmAction(title, message, confirmLabel, onConfirm, cancelLabel = 'Cancel') {
  showModal({
    title,
    message,
    confirmLabel: confirmLabel || 'Confirm',
    cancelLabel,
    onConfirm,
    icon: 'help-circle-outline',
  });
}

export function showExitConfirmation(onConfirm) {
  showModal({
    title: `Exit ${BRAND.brand.name}?`,
    message: 'Are you sure you want to exit the application?',
    confirmLabel: 'Exit',
    cancelLabel: 'Stay',
    onConfirm,
    isDanger: true,
    icon: 'exit-to-app',
  });
}
