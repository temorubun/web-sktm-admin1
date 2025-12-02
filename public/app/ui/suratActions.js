
document.addEventListener('DOMContentLoaded', function(){
  window.confirmCreateAndSend = async function(){
    const data = window.a || {};
    const docs = data?.data_web?.admin1?.data_surat?.dokumen || [];
    if(!docs || docs.length === 0){
      await showModal({ 
        icon: '⚠️', 
        title: 'Tidak Ada Dokumen yang Dilampirkan', 
        message: 'Harap Tolak & Hapus Surat dengan catatan tidak ada dokumen yang dilampirkan dan wajib menyertakan dokumen.', 
        variant: 'danger', 
        buttons: [{label: 'Tutup', variant: 'secondary', value: true}]
      });
      return;
    }
    const ok = await confirmModal(
      'Konfirmasi Pembuatan Surat',
      'Dengan menekan <b>Setujui & Proses</b>, sistem akan membuat dokumen berdasarkan data saat ini dan mengirimkannya.',
      {okLabel: 'Setujui & Proses', cancelLabel: 'Tinjau Kembali', icon: '📨'}
    );
    if(!ok) return;
    await generateAndSendLetter();
    
  }
});

document.addEventListener('DOMContentLoaded', function(){
  window.generateAndSendLetter = async function(){
    try {
      if (window.disableAllButtons) window.disableAllButtons();
      if (window.showStatusMessage) window.showStatusMessage('Surat telah terkirim');
      
      // showLoading(true, 'Memproses pembuatan surat dan pengiriman data…');
      sendJSON('CREATE_AND_SEND');
      await successModal('Surat Berhasil Dibuat', 'Data dan surat telah dikirim untuk verifikasi.');
    } catch(e) {
      await showModal({
        icon: '⚠️',
        title: 'Gagal Membuat Surat',
        message: 'Terjadi kendala saat membuat atau mengirim surat.<br><span class="mono">' + (e.message || e) + '</span>',
        variant: 'danger',
        buttons: [{label: 'Tutup', variant: 'secondary', value: true}]
      });
    } finally {
      showLoading(false);
    }
  }
});

  /* ===== Show Delete/Reject Modal ===== */
document.addEventListener('DOMContentLoaded', function(){
  window.showRejectModal = async function(isDeleteOnly = false) {
    return new Promise(resolve => {
      const isDelete = isDeleteOnly || false;
      const title = isDelete ? 'Hapus Permohonan' : 'Tolak & Hapus Permohonan';
      const actionText = isDelete ? 'Hapus' : 'Tolak & Hapus';
      const placeholder = isDelete 
        ? 'Opsional: Tulis catatan untuk penghapusan ini…' 
        : 'Tulis alasan penolakan atau instruksi untuk pemohon (wajib diisi)…';
      const required = !isDelete;

      // Create modal content with note input
      const modalContent = `
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e5e7eb;">
            ${isDelete ? 'Catatan Penghapusan' : 'Catatan'}:
          </label>
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
          " placeholder="${placeholder}"></textarea>
        </div>
      `;
      
      modalIcon.textContent = isDelete ? '🗑️' : '⛔';
      modalTitle.textContent = title;
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
      
      const actionBtn = document.createElement('button');
      actionBtn.className = 'btn danger';
      actionBtn.textContent = actionText;
      actionBtn.onclick = async () => {
        const noteText = document.getElementById('rejectNoteText').value.trim();
        
        if (required && !noteText) {
          await infoModal('Catatan Wajib', 'Silakan tulis catatan terlebih dahulu.');
          return;
        }
        
        hide();
        
        // For delete action, use a default message if no note is provided
        const message = noteText || 'Permohonan telah dihapus oleh admin.';
        await processRejectWithNote(message, isDelete);
        resolve(true);
      };
      
      modalActions.appendChild(cancelBtn);
      modalActions.appendChild(actionBtn);
      
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
});

  /* ===== Process Reject/Delete with Note ===== */
document.addEventListener('DOMContentLoaded', () => {
  window.processRejectWithNote = processRejectWithNote;

  async function processRejectWithNote(noteText, isDeleteOnly = false) {
    try {
      // Disable all buttons immediately
      if (window.disableAllButtons) window.disableAllButtons();
      
      // First send the message if we have a note or it's a delete action
      if (noteText) {
        // showLoading(true, 'Mengirim pesan…');
        const targetUrl = getWebhookUrl('SEND_MESSAGE');
        
        if (targetUrl) {
          // Use the same payload structure as other actions
          const payload = {
            ...buildBasePayload('SEND_MESSAGE'),
            message: noteText,
          };
          
          const resp = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!resp.ok) {
            throw new Error('Gagal mengirim pesan');
          }
          
          // Small delay to ensure message is processed
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Then delete the data
      // showLoading(true, 'Menghapus data…');
      await performDeleteAll();
      
      // Show appropriate success message
      const successTitle = isDeleteOnly ? 'Penghapusan Berhasil' : 'Permohonan Ditolak';
      const successMessage = isDeleteOnly 
        ? 'Data permohonan telah dihapus dari sistem.'
        : 'Catatan penolakan telah dikirim dan data telah dihapus dari sistem.';
      
      await successModal(successTitle, successMessage);
      
      // Reload the page
      location.reload();
      
    } catch (e) {
      const errorTitle = isDeleteOnly ? 'Gagal Menghapus' : 'Gagal Memproses';
      const errorMessage = isDeleteOnly 
        ? 'Terjadi kendala saat menghapus data.'
        : 'Terjadi kendala saat memproses permintaan.';
      
      await showModal({
        icon: '⚠️',
        title: errorTitle,
        message: `${errorMessage}<br><span class="mono">${e.message || e}</span>`,
        variant: 'danger',
        buttons: [{ label: 'Tutup', variant: 'secondary', value: true }]
      });
      
      // Don't re-enable buttons on error
      throw e;
    } finally {
      showLoading(false);
      // Don't re-enable buttons after operation
    }
  }
});

