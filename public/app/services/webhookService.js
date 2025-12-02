document.addEventListener('DOMContentLoaded', function() {
  window.ACTION_ENDPOINTS = {
    'CREATE_AND_SEND': 'kirim_surat',
    'DELETE_ALL': 'hapus_surat',
    'SEND_MESSAGE': 'kirim_pesan'
  };
});

document.addEventListener('DOMContentLoaded', function() {
  window.getWebhookUrl = function(action = null){
    if (!window.a || typeof window.a !== 'object') {
      console.error('window.a tidak valid:', window.a);
      return null;
    }

    const tombol = window.a?.data_web?.admin1?.tombol;
    if (!tombol || typeof tombol !== 'object') {
      console.error('Konfigurasi tombol tidak ditemukan pada data_web.admin1.tombol');
      return null;
    }

    if (!action || !ACTION_ENDPOINTS[action]) {
      console.error('Action webhook tidak dikenali:', action);
      return null;
    }

    const fieldName = ACTION_ENDPOINTS[action];
    const url = tombol[fieldName];


    return url;
  }
});


document.addEventListener('DOMContentLoaded', function() {
  window.sendJSON = async function(action, extras={}){
    
    const targetUrl = getWebhookUrl(action);

    const payload = { ...window.buildBasePayload(action), ...extras };
    
    const resp = await fetch(targetUrl,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const text = await resp.text();
    
    if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
    return text;
  };
});

document.addEventListener('DOMContentLoaded', function() {
  window.performDeleteAll = async function(){
    const targetUrl = getWebhookUrl('DELETE_ALL');
    if(!targetUrl){
      throw new Error('Endpoint layanan belum dikonfigurasi. Silakan periksa pengaturan terlebih dahulu.');
    }

    // Hanya kirim data dasar hasil buildBasePayload
    const payload = buildBasePayload('DELETE_ALL');


    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await resp.text();
    
    if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
    
    return text;
  };
});

document.addEventListener('DOMContentLoaded', function() {
  window.ACTION_ENDPOINTS = {
    'CREATE_AND_SEND': 'kirim_surat',
    'DELETE_ALL': 'hapus_surat',
    'SEND_MESSAGE': 'kirim_pesan'
  };
});

document.addEventListener('DOMContentLoaded', function() {
  window.getWebhookUrl = function(action = null){
    if (!window.a || typeof window.a !== 'object') {
      console.error('window.a tidak valid:', window.a);
      return null;
    }

    const tombol = window.a?.data_web?.admin1?.tombol;
    if (!tombol || typeof tombol !== 'object') {
      console.error('Konfigurasi tombol tidak ditemukan pada data_web.admin1.tombol');
      return null;
    }

    if (!action || !ACTION_ENDPOINTS[action]) {
      console.error('Action webhook tidak dikenali:', action);
      return null;
    }

    const fieldName = ACTION_ENDPOINTS[action];
    const url = tombol[fieldName];


    return url;
  }
});


document.addEventListener('DOMContentLoaded', function() {
  window.sendJSON = async function(action, extras={}){
    
    const targetUrl = getWebhookUrl(action);

    const payload = { ...window.buildBasePayload(action), ...extras };
    
    const resp = await fetch(targetUrl,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const text = await resp.text();
    
    if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
    return text;
  };
});

document.addEventListener('DOMContentLoaded', function() {
  window.performDeleteAll = async function(){
    const targetUrl = getWebhookUrl('DELETE_ALL');
    if(!targetUrl){
      throw new Error('Endpoint layanan belum dikonfigurasi. Silakan periksa pengaturan terlebih dahulu.');
    }

    // Hanya kirim data dasar hasil buildBasePayload
    const payload = buildBasePayload('DELETE_ALL');


    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await resp.text();
    
    if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
    
    return text;
  };
});

document.addEventListener('DOMContentLoaded', function() {
  window.ACTION_ENDPOINTS = {
    'CREATE_AND_SEND': 'kirim_surat',
    'DELETE_ALL': 'hapus_surat',
    'SEND_MESSAGE': 'kirim_pesan'
  };
});

document.addEventListener('DOMContentLoaded', function() {
  window.getWebhookUrl = function(action = null){
    if (!window.a || typeof window.a !== 'object') {
      console.error('window.a tidak valid:', window.a);
      return null;
    }

    const tombol = window.a?.data_web?.admin1?.tombol;
    if (!tombol || typeof tombol !== 'object') {
      console.error('Konfigurasi tombol tidak ditemukan pada data_web.admin1.tombol');
      return null;
    }

    if (!action || !ACTION_ENDPOINTS[action]) {
      console.error('Action webhook tidak dikenali:', action);
      return null;
    }

    const fieldName = ACTION_ENDPOINTS[action];
    const url = tombol[fieldName];


    return url;
  }
});


document.addEventListener('DOMContentLoaded', function() {
  window.sendJSON = async function(action, extras={}){
    
    const targetUrl = getWebhookUrl(action);

    const payload = { ...window.buildBasePayload(action), ...extras };
    
    const resp = await fetch(targetUrl,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const text = await resp.text();
    
    if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
    return text;
  };
});

document.addEventListener('DOMContentLoaded', function() {
  window.performDeleteAll = async function(){
    const targetUrl = getWebhookUrl('DELETE_ALL');
    if(!targetUrl){
      throw new Error('Endpoint layanan belum dikonfigurasi. Silakan periksa pengaturan terlebih dahulu.');
    }

    // Hanya kirim data dasar hasil buildBasePayload
    const payload = buildBasePayload('DELETE_ALL');


    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await resp.text();
    
    if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
    
    return text;
  };
});

