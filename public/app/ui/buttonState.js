document.addEventListener('DOMContentLoaded', () => {
  const BUTTON_IDS = [
    'createSendBtn',   // tombol Setujui & TTD
    'rejectBtn',       // tombol Tolak & Hapus
    'deleteAllBtn'     // jika ada tombol Hapus Semua
  ];

  function disableAllButtons() {
    BUTTON_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = true;
    });
  }

  function enableAllButtons() {
    BUTTON_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });
  }

  window.disableAllButtons = disableAllButtons;
  window.enableAllButtons = enableAllButtons;
});
