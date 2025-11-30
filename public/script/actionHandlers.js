/* ===== Utils ===== */
function normalizeDocs(docs) {
  const arr = Array.isArray(docs) ? docs.filter(Boolean) : [];
  const seen = new Set();
  const out = [];
  
  for (const d of arr) {
    const fid = d?.file_id || d?.id || d?.fileId || null;
    const hasUrl = !!(d?.view_url || d?.download_url);
    if (!fid && !hasUrl) continue;
    
    const key = fid 
      ? `fid:${fid}` 
      : `name:${(d?.name || d?.nama_file || '').toLowerCase()}|size:${d?.size || d?.ukuran || 0}`;
      
    if (seen.has(key)) continue;
    seen.add(key);
    
    out.push({
      label: d?.label ?? d?.name ?? d?.nama_file ?? '-',
      name: d?.name ?? d?.nama_file ?? d?.label ?? '-',
      file_id: fid,
      view_url: d?.view_url ?? null,
      download_url: d?.download_url ?? null,
      size: d?.size ?? d?.ukuran ?? null,
      mimeType: d?.mimeType ?? d?.tipe ?? d?.mime ?? null
    });
  }
  return out;
}

// Helper to get function from window with better error handling
function getWindowFunction(name, fallback = null) {
  return (...args) => {
    try {
      if (window[name]) {
        const result = window[name](...args);
        return result?.then ? result.catch(e => {
          console.error(`Error in ${name}:`, e);
          throw e;
        }) : result;
      }
      if (fallback) {
        return fallback(...args);
      }
      throw new Error(`${name} is not defined and no fallback provided`);
    } catch (error) {
      console.error(`Error in getWindowFunction(${name}):`, error);
      throw error;
    }
  };
}

// Fallback modal implementation
function fallbackShowModal({icon='ℹ️', title='Informasi', message='', buttons=[{label:'Tutup',variant:'secondary',value:true}], variant='info', closable=true}={}) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalActions = document.getElementById('modalActions');
  
  if (!modalOverlay || !modalBox || !modalIcon || !modalTitle || !modalMessage || !modalActions) {
    console.error('Modal elements not found');
    return Promise.resolve(null);
  }
  
  return new Promise(resolve => {
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    modalActions.innerHTML = '';
    modalBox.className = 'modal modal--' + variant;
    
    buttons.forEach(btn => {
      const el = document.createElement('button');
      el.className = 'btn ' + (btn.primary ? 'primary' : btn.danger ? 'danger' : btn.variant || 'secondary');
      el.textContent = btn.label || 'OK';
      el.onclick = () => { hide(); resolve(btn.value); };
      modalActions.appendChild(el);
    });
    
    function onEsc(e) { if(e.key === 'Escape' && closable) { hide(); resolve(null); } }
    function hide() { modalOverlay.style.display = 'none'; document.removeEventListener('keydown', onEsc); }
    
    modalOverlay.style.display = 'flex';
    document.addEventListener('keydown', onEsc);
  });
}

const showModal = getWindowFunction('showModal', fallbackShowModal);
const confirmModal = getWindowFunction('confirmModal', (title, message, opts = {}) => {
  return showModal({
    icon: opts.icon || '❓',
    title,
    message,
    variant: 'confirm',
    buttons: [
      {label: opts.cancelLabel || 'Batal', variant: 'secondary', value: false},
      {label: opts.okLabel || 'Lanjutkan', primary: !opts.danger, danger: opts.danger, value: true}
    ]
  });
});
const successModal = getWindowFunction('successModal', (title, message) => {
  return showModal({icon: '✅', title, message, variant: 'success', buttons: [{label: 'Tutup', variant: 'secondary', value: true}]});
});
const infoModal = getWindowFunction('infoModal', (title, message) => {
  return showModal({icon: 'ℹ️', title, message, variant: 'info', buttons: [{label: 'Tutup', variant: 'secondary', value: true}]});
});
const showLoading = getWindowFunction('showLoading', (show, text) => {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (loadingText && text) loadingText.textContent = text;
  if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
});
const baseHref = getWindowFunction('baseHref', () => location.href);

/* ===== Create / Delete Surat ===== */
async function confirmCreateAndSend(obj = window.lastObj || {}){
  const ok = await confirmModal(
    'Konfirmasi Pembuatan Surat',
    'Dengan menekan <b>Setujui & Proses</b>, sistem akan membuat dokumen berdasarkan data saat ini dan mengirimkannya.',
    {okLabel: 'Setujui & Proses', cancelLabel: 'Tinjau Kembali', icon: '📨'}
  );
  if(!ok) return;
  await generateAndSendLetter();
}

async function generateAndSendLetter(){
  try {
    if (window.editMode && window.saveChanges) await window.saveChanges();
    showLoading(true, 'Memproses pembuatan surat dan pengiriman data…');
    
    if (window.ApiService) {
      const result = await window.ApiService.sendLetter(window.lastObj || {});
      if (result.success) {
        await successModal('Surat Berhasil Dibuat', 'Data dan surat telah dikirim untuk verifikasi.');
      } else {
        throw new Error(result.error || 'Gagal mengirim surat');
      }
    } else {
      throw new Error('ApiService tidak tersedia');
    }
  } catch(e) {
    await showModal({
      icon: '⚠️',
      title: 'Gagal Membuat Surat',
      message: `Terjadi kendala saat membuat atau mengirim surat.<br><span class="mono">${e.message || e}</span>`,
      variant: 'danger',
      buttons: [{label: 'Tutup', variant: 'secondary', value: true}]
    });
  } finally { 
    showLoading(false); 
  }
}

async function confirmDeleteAll(){
  const ok = await showModal({ 
    icon: '🗑️',
    title: 'Konfirmasi Penghapusan', 
    message: 'Tindakan ini akan <b>menghapus seluruh data dan surat</b> terkait referensi ini. Lanjutkan?', 
    variant: 'confirm', 
    buttons: [
      {label: 'Batal', variant: 'secondary', value: false}, 
      {label: 'Ya, Hapus Semua', danger: true, value: true}
    ] 
  });
  if(!ok) return; 
  await deleteLetterAndData();
}

async function deleteLetterAndData(){
  try {
    showLoading(true, 'Menghapus surat dan seluruh data terkait…');
    
    if (window.ApiService) {
      const result = await window.ApiService.deleteMessage(window.lastObj?.id);
      if (result.success) {
        await successModal('Penghapusan Berhasil', 'Surat dan seluruh data terkait telah dihapus dari sistem.');
        location.reload();
      } else {
        throw new Error(result.error || 'Gagal menghapus surat');
      }
    } else {
      throw new Error('ApiService tidak tersedia');
    }
  } catch(e) {
    await showModal({ 
      icon: '⚠️', 
      title: 'Gagal Menghapus', 
      message: `Terjadi kendala saat menghapus surat atau data.<br><span class="mono">${e.message || e}</span>`, 
      variant: 'danger', 
      buttons: [{label: 'Tutup', variant: 'secondary', value: true}] 
    });
  } finally { 
    showLoading(false); 
  }
}

/* ===== Show Reject Modal with Notes ===== */
async function showRejectModal(){
  return new Promise(resolve => {
    // Get modal elements from DOM or window
    const modalOverlay = document.getElementById('modalOverlay');
    const modalBox = document.getElementById('modalBox');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalActions = document.getElementById('modalActions');
    
    if (!modalOverlay || !modalBox || !modalIcon || !modalTitle || !modalMessage || !modalActions) {
      console.error('Modal elements not found');
      resolve(false);
      return;
    }
    
    // Create modal content with note input
    const modalContent = `
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e5e7eb;">Catatan Kepala {{ $json.data_web.admin1.data_surat.admin.jabatan }} :</label>
        <textarea id="rejectNoteText" style="
          width: 100%; 
          min-height: 110px; 
          resize: vertical; 
          color: #e5e7eb; 
          font-size: 14px; 
          line-height: 1.6;
          background: #0e162b; 
          border: 1px solid rgba(56,189,248,.35); 
          border-radius: 12px; 
          padding: 12px 14px; 
          box-shadow: inset 0 0 0 1px rgba(56,189,248,.15);
        " placeholder="Tulis alasan penolakan atau instruksi untuk pemohon (wajib diisi)…"></textarea>
      </div>
    `;
    
    modalIcon.textContent = '⛔';
    modalTitle.textContent = 'Tolak & Hapus Permohonan';
    modalMessage.innerHTML = modalContent;
    modalActions.innerHTML = '';
    modalBox.className = 'modal modal--danger';
    
    // Create buttons
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn secondary';
    cancelBtn.textContent = 'Batal';
    cancelBtn.onclick = () => {
      hide();
      resolve(false);
    };
    
    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn danger';
    rejectBtn.textContent = 'Tolak & Hapus';
    rejectBtn.onclick = async () => {
      const noteText = document.getElementById('rejectNoteText')?.value.trim();
      if (!noteText) {
        await infoModal('Catatan Wajib', 'Silakan tulis alasan penolakan terlebih dahulu.');
        return;
      }
      hide();
      await processRejectWithNote(noteText);
      resolve(true);
    };
    
    modalActions.appendChild(cancelBtn);
    modalActions.appendChild(rejectBtn);
    
    function onEsc(e) {
      if (e.key === 'Escape') {
        hide();
        resolve(false);
      }
    }
    
    function hide() {
      modalOverlay.style.display = 'none';
      document.removeEventListener('keydown', onEsc);
    }
    
    modalOverlay.style.display = 'flex';
    document.addEventListener('keydown', onEsc);
    
    // Focus on textarea
    setTimeout(() => {
      const textarea = document.getElementById('rejectNoteText');
      if (textarea) textarea.focus();
    }, 100);
  });
}

/* ===== Process Reject with Note ===== */
async function processRejectWithNote(noteText) {
  try {
    showLoading(true, 'Mengirim catatan penolakan...');
    
    if (window.ApiService) {
      const result = await window.ApiService.sendMessage(
        `Catatan Penolakan: ${noteText}`,
        window.lastObj?.admin_phone || '' // Replace with actual admin phone field
      );
      if (result.success) {
        // Add this line to fix the try-catch structure
      }
    }
    if (targetUrl) {
      const payload = {
        action: 'SEND_MESSAGE',
        id_admin1: DATA_REF,
        id_surat: baseHref(),
        message: noteText,
        from: '{{ $json.data_web.admin1.data_surat.admin.jabatan }} ',
        json: lastObj || {},
        data: lastObj || {},
        meta: { ref: lastObj?.ref || DATA_REF, operator: lastObj?.operator || null, at: new Date().toISOString() }
      };
      
      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (resp.ok) {
        showLoading(true, 'Memproses penolakan dan penghapusan data…');
        // Wait a bit before deleting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Then delete the data
    await performDeleteAll();
    await successModal('Permohonan Ditolak', 'Catatan penolakan telah dikirim dan data telah dihapus dari sistem.');
    location.reload();
  } catch (e) {
    await showModal({
      icon: '⚠️',
      title: 'Gagal Memproses Penolakan',
      message: 'Terjadi kendala saat memproses penolakan.<br><span class="mono">' + (e.message || e) + '</span>',
      variant: 'danger',
      buttons: [{ label: 'Tutup', variant: 'secondary', value: true }]
    }).then(() => location.reload());
  } finally {
    showLoading(false);
  }
}

// Ekspos fungsi ke window
window.confirmCreateAndSend = confirmCreateAndSend;
window.showRejectModal = showRejectModal;
window.confirmDeleteAll = confirmDeleteAll;
window.deleteLetterAndData = deleteLetterAndData;
window.generateAndSendLetter = generateAndSendLetter;
window.processRejectWithNote = processRejectWithNote;