document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalActions = document.getElementById('modalActions');

  function showModal({
    icon = 'ℹ️',
    title = 'Informasi',
    message = '',
    buttons = [{ label: 'Tutup', variant: 'secondary', value: true }],
    variant = 'info',
    closable = true
  } = {}) {
    return new Promise(resolve => {
      if (!modalOverlay || !modalBox || !modalIcon || !modalTitle || !modalMessage || !modalActions) {
        console.error('Elemen modal tidak lengkap di DOM');
        resolve(null);
        return;
      }

      modalIcon.textContent = icon;
      modalTitle.textContent = title;
      modalMessage.innerHTML = message;
      modalActions.innerHTML = '';

      modalBox.className = 'modal modal--' + variant;

      buttons.forEach(btn => {
        const el = document.createElement('button');
        el.className = 'btn ' + (btn.primary ? 'primary' : btn.danger ? 'danger' : (btn.variant || 'secondary'));
        el.textContent = btn.label || 'OK';
        el.onclick = () => {
          hide();
          resolve(btn.value);
        };
        modalActions.appendChild(el);
      });

      function onEsc(e) {
        if (e.key === 'Escape' && closable) {
          hide();
          resolve(null);
        }
      }

      function hide() {
        modalOverlay.style.display = 'none';
        document.removeEventListener('keydown', onEsc);
      }

      modalOverlay.style.display = 'flex';
      document.addEventListener('keydown', onEsc);
    });
  }

  function infoModal(title, message) {
    return showModal({
      icon: 'ℹ️',
      title,
      message,
      variant: 'info',
      buttons: [{ label: 'Tutup', variant: 'secondary', value: true }]
    });
  }

  function successModal(title, message) {
    return showModal({
      icon: '✅',
      title,
      message,
      variant: 'success',
      buttons: [{ label: 'Tutup', variant: 'secondary', value: true }]
    });
  }

  function confirmModal(title, message, {
    okLabel = 'Lanjutkan',
    cancelLabel = 'Batal',
    icon = '❓',
    danger = false
  } = {}) {
    return showModal({
      icon,
      title,
      message,
      variant: 'confirm',
      buttons: [
        { label: cancelLabel, variant: 'secondary', value: false },
        { label: okLabel, primary: !danger, danger, value: true }
      ]
    });
  }

  window.showModal = showModal;
  window.infoModal = infoModal;
  window.successModal = successModal;
  window.confirmModal = confirmModal;
});
