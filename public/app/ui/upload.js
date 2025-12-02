if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFileHandling);
} else {
    initializeFileHandling();
}

if (!window.utils) {
    window.utils = {
        toStr: (val, def = '') => val != null ? String(val) : def,
        humanSize: (bytes) => {
            if (!bytes) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    };
}

function initializeFileHandling() {
    try {
        const data = window.a || {};
        const dokumen = data?.data_web?.admin1?.data_surat?.dokumen;
        
        if (Array.isArray(dokumen) && dokumen.length > 0) {
            renderFileList({ dokumen });
        } else {
            updateSendButtonState(false);
        }
    } catch (error) {
        updateSendButtonState(false);
    }
}

window.fileHandling = {
    init: initializeFileHandling,
    renderFiles: renderFileList,
    updateButton: updateSendButtonState
};

function normalizeDocuments(docs) {
    const arr = Array.isArray(docs) ? docs.filter(Boolean) : [];
    const seen = new Set();
    const result = [];
    
    for (const doc of arr) {
        const fileId = doc?.id || null;
        const hasUrl = !!(doc?.view || doc?.download);
        
        if (!fileId && !hasUrl) continue;
        
        const fileName = doc?.nama || '';
        const uniqueKey = fileId ? `fid:${fileId}` : `name:${fileName.toLowerCase()}`;
        
        if (seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);
        
        result.push({
            nama: fileName,
            id: fileId,
            view: doc?.view || null,
            download: doc?.download || null,
            size: doc?.size || 0,
            tipe: doc?.tipe || ''
        });
    }
    
    return result;
}

function updateSendButtonState(hasFiles) {
    const sendButton = document.getElementById('createSendBtn');
    if (sendButton) {
        sendButton.disabled = !hasFiles;
        sendButton.title = hasFiles ? '' : 'Unggah file terlebih dahulu';
    }
}

function renderFileList(data) {
    try {
        const fileListContainer = window.VIEW?.filesList;
        if (!fileListContainer) return;
        
        fileListContainer.innerHTML = '';
        
        if (!data) {
            updateSendButtonState(false);
            return;
        }
        
        const dokumen = Array.isArray(data.dokumen) ? data.dokumen : [];
        const documents = normalizeDocuments(dokumen);
        
        updateSendButtonState(documents.length > 0);
        
        if (documents.length === 0) {
            const messageElement = document.createElement('div');
            messageElement.className = 'no-files-message';
            messageElement.textContent = 'Belum ada file yang diupload';
            fileListContainer.appendChild(messageElement);
            return;
        }
        
        documents.forEach(file => {
            if (!file) return;
            const fileElement = createFileElement(file);
            if (fileElement) {
                fileListContainer.appendChild(fileElement);
            }
        });
        
    } catch (error) {
        updateSendButtonState(false);
    }
}

function createFileElement(file) {
    const row = document.createElement('div');
    row.className = 'uploaded-file-item';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'file-name';
    nameElement.textContent = window.utils.toStr(file.nama, '(tanpa nama)');
    row.appendChild(nameElement);
    
    const metaData = [];
    if (file.size != null) metaData.push(`Ukuran: ${window.utils.humanSize(parseInt(file.size))}`);
    if (file.tipe) metaData.push(file.tipe);
    
    const metaElement = document.createElement('div');
    metaElement.className = 'file-meta';
    metaElement.textContent = metaData.join(' • ') || '—';
    row.appendChild(metaElement);
    
    const actionsElement = document.createElement('div');
    actionsElement.className = 'file-actions';
    
    if (file.view) {
        const viewButton = createActionButton('👁️ Lihat', file.view, 'success');
        viewButton.target = '_blank';
        viewButton.rel = 'noopener';
        actionsElement.appendChild(viewButton);
    }
    
    if (file.download) {
        const downloadButton = createActionButton('💾 Download', file.download, 'secondary');
        downloadButton.download = '';
        downloadButton.target = '_blank';
        downloadButton.rel = 'noopener';
        actionsElement.appendChild(downloadButton);
    }
    
    row.appendChild(actionsElement);
    return row;
}

function createActionButton(text, url, type) {
    const button = document.createElement('a');
    button.href = url;
    button.textContent = text;
    button.className = `btn ${type}`;
    return button;
}

