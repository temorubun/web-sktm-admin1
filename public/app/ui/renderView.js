function loadApplicantData() {
    const data = window.fetchedData [0]|| {};
    const kop = data?.data_web?.admin1?.data_surat?.kop || {};
    const nomor_surat = data?.data_web?.admin1?.nomor_surat || '';
    const pemohon = data?.data_web?.user?.data_surat?.pemohon || {};
    const keterangan = data?.data_web?.admin1?.data_surat?.keterangan_sktm || {};
    const date = data?.data_web?.admin1?.tanggal || '';
    const chat_id = data?.data_web?.user?.whatsapp?.chat_id || '';
    const dokumen = data?.data_web?.admin1?.data_surat?.dokumen || [];
    const statusAdmin = data?.data_web?.admin1?.status || '';
    const tahun = new Date().getFullYear();

    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value || '';
        return element;
    };

    updateElement('title', `Kawe Nia • ${kop.kampung_kelurahan || ''}`);
    updateElement('pill', '🟢 Layanan aktif • 24/7');
    updateElement('stitle', 'Data Pemohon');
    updateElement('labNama', 'Nama');
    updateElement('labNIK', 'NIK');
    updateElement('labTempatTglLahir', 'Tempat/Tgl Lahir');
    updateElement('labAgama', 'Agama');
    updateElement('labJenisKelamin', 'Jenis Kelamin');
    updateElement('labStatusPerkawinan', 'Status Perkawinan');
    updateElement('labPekerjaan', 'Pekerjaan');
    updateElement('labAlamat', 'Alamat');
    updateElement('labKelurahan', 'Kelurahan');
    updateElement('labKecamatan', 'Kecamatan');
    updateElement('labKotaKab', 'Kota/Kabupaten');
    updateElement('labProvinsi', 'Provinsi');
    updateElement('sep', ':');
    updateElement('stitleFile', 'File Terupload');
    updateElement('stitleKeterangan', 'Keterangan');
    updateElement('noFilesMessage', 'Belum ada file yang diupload');
    updateElement('stitleTindakan', 'Tindakan');
    updateElement('createSendBtn', '✅ Setujui & TTD');
    updateElement('rejectBtn', '⛔ Tolak & Hapus');
    updateElement('stitleRingkasan', 'Ringkasan');
    updateElement('footer', `© ${tahun} Pemerintah Distrik Wania • Kawe Nia`);
    updateElement('loadingText', 'Memuat data… Mohon menunggu.');

    updateElement('operator', '👤 Operator: KaweNia ');
    updateElement('tanggal', `📅 Tanggal: ${date}`);
    updateElement('referensi', '🔗 Referensi: KaweNia SKTM');
    updateElement('from', `🧭 From: ${chat_id}`);

    updateElement('kopHeader1', kop.pemerintah_kabupaten);
    updateElement('kopHeader2', kop.distrik);
    updateElement('kopHeader3', kop.kampung_kelurahan);
    updateElement('kopHeader4', `${kop.alamat || ''} - ${kop.provinsi || ''} ${kop.kode_pos || ''}`);
    updateElement('kopHeader5', kop.email);
    updateElement('suratHeader', 'SURAT KETERANGAN TIDAK MAMPU');
    updateElement('nomorSuratHeader', `Nomor : ${nomor_surat}`);

    updateElement('nama', pemohon.nama);
    updateElement('nik', pemohon.nik);
    updateElement('ttl', pemohon.ttl);
    updateElement('agama', pemohon.agama);
    updateElement('jenis_kelamin', pemohon.jenis_kelamin);
    updateElement('status_perkawinan', pemohon.status_perkawinan);
    updateElement('pekerjaan', pemohon.pekerjaan);
    updateElement('alamat', pemohon.alamat);
    updateElement('kelurahan', pemohon.kampung_kelurahan);
    updateElement('kecamatan', pemohon.kecamatan);
    updateElement('kota_kab', pemohon.kota_kabupaten);
    updateElement('provinsi', pemohon.provinsi);

    const filesList = document.getElementById('uploadedFilesList');
    if (window.fileHandling?.renderFiles && filesList) {
        window.VIEW = window.VIEW || {};
        window.VIEW.filesList = filesList;
        // Kirim dokumen langsung karena sudah dalam bentuk array
        window.fileHandling.renderFiles({ dokumen });
    } else {
        console.error('File handling not initialized or filesList not found');
    }

    updateElement('keterangan1', keterangan.keterangan_1);
    updateElement('keterangan2', keterangan.keterangan_2);
    updateElement('keterangan3', keterangan.keterangan_3);
    updateElement('keterangan4', keterangan.keterangan_4);
    updateElement('keterangan5', keterangan.keterangan_5);

    const titleElement = document.querySelector('title');
    if (titleElement) {
        titleElement.textContent = `Kawe Nia • Layanan SKTM • ${kop.kampung_kelurahan || ''}`;
    }

    const emailLink = document.getElementById('kopEmailLink');
    if (emailLink && kop.email) {
        emailLink.textContent = kop.email;
        emailLink.href = `mailto:${kop.email}`;
    }

    const logoElement = document.getElementById('logo');
    if (logoElement) {
        const logoUrl = data?.data_web?.admin1?.logo || '';
        logoElement.src = logoUrl;
    }

    // Jika status admin menunjukkan surat telah terkirim, kunci tombol dan tampilkan status
    if (typeof statusAdmin === 'string' && statusAdmin.toLowerCase().includes('terkirim')) {
        if (window.disableAllButtons) window.disableAllButtons();
        if (window.showStatusMessage) window.showStatusMessage('Surat telah terkirim');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.fetchedData) {
        loadApplicantData();
    }
    window.addEventListener('dataReady', loadApplicantData);
});

