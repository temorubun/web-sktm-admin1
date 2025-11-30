document.addEventListener('DOMContentLoaded', function() {
  window.fetchedData = null;

  const encrypted = "w2uo5z_82_e3cad0b2e1cacfb4cefbbbe9e3daccb2e1efeef0e6b0c4f7e3d5c7f7dbb0bbf6ceb0f2f8e0b0b6f4cfd4d7b7d6d7d4c1d8efc4e3d6efd0d2dbd5e5f5d7f8c0d5e1d6eee3d5d5eac4d3d7eafbd8d5d0f4e1c7f2b1"; 

  const parts = encrypted.split("_");
  const key = parseInt(parts[1], 16);  
  const hexData = parts[2];

  const bytes = hexData.match(/.{2}/g).map(h => parseInt(h, 16));

  let base64 = "";
  for (let i = 0; i < bytes.length; i++) {
    base64 += String.fromCharCode(bytes[i] ^ key);
  }

  const url = atob(base64);

  // Tampilkan loading saat mulai mengambil data awal
  if (window.showLoading) {
    window.showLoading(true, 'Memuat data awal… Mohon menunggu.');
  }

  fetch(url)
    .then(r => {
      if (!r.ok) {
        console.error('Data gagal diambil. Kode HTTP:', r.status);
        throw new Error('Gagal memuat data awal. Kode HTTP: ' + r.status);
      }
      console.log('Data berhasil diambil dari server');
      return r.json();
    })
    .then(d => {
      console.log('d', d);
      window.fetchedData = d;
      window.dispatchEvent(new CustomEvent('dataReady'));
      if (window.showLoading) {
        window.showLoading(false);
      }
    })
    .catch(err => {
      console.error('Terjadi kesalahan saat memuat data awal:', err);
      console.error('Data gagal diambil:', err.message);
      if (window.showLoading) {
        window.showLoading(false);
      }
    });
});
