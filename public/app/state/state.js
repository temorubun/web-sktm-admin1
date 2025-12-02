document.addEventListener('DOMContentLoaded', function() {
  window.a = null;

  function b(c) {
    if (Array.isArray(c)) {
      return c[0] || {}; 
    }

    if (c === null || c === undefined) {
      return {};
    }

    return c;
  }

  function d(data, key) {
    if (!data || !key) {
      console.error('Data dan key harus disediakan');
      return null;
    }
    
    const parts = data.split('_');
    if (parts.length < 3) {
      console.error('Format data tidak valid');
      return null;
    }
    
    const noise = parts[0];              
    const keyLengthHex = parts[1];       
    const hexEncrypted = parts[2];       

    let xorResult = [];
    for (let i = 0; i < hexEncrypted.length; i += 2) {
      xorResult.push(parseInt(hexEncrypted.substr(i, 2), 16));
    }

    let baseDecoded = '';
    for (let i = 0; i < xorResult.length; i++) {
      let keyCharCode = key.charCodeAt(i % key.length);
      let charCode = xorResult[i] ^ keyCharCode;
      baseDecoded += String.fromCharCode(charCode);
    }

    try {
      const decodedData = atob(baseDecoded);
      try {
        return JSON.parse(decodedData);
      } catch (e) {
        return decodedData;
      }
    } catch (e) {
      console.error('Decryption error:', e);
      return null;
    }
  }

  function decryptWithoutKey(encrypted) {
    if (!encrypted) {
      console.error('Data harus disediakan');
      return null;
    }

    try {
      const parts = encrypted.split('_');
      if (parts.length < 2) {
        console.error('Format data tidak valid');
        return null;
      }
      
      const noise = parts[0];  
      const base64Data = parts.slice(1).join('_');  
      let decodedData = atob(base64Data);
      try {
        return JSON.parse(decodedData);
      } catch (e) {
        return decodedData;   
      }
    } catch (e) {
      console.error('Dekripsi tanpa key gagal:', e);
      return null;
    }
  }

          
  const m = "u0ch7y_21_781c013d7e332d51165d543d3b411e35370b1e0100333f1d2d193d6f3b0e332f18673f2014633e5e"; 
  const n = "01bhg0_21_781b38287f2f2a531600543d3b43062d34351a0531563f1d1b083e5c";
  const o = "9pcvex_21_781c0274543f211b3a055501381a3c37222916642a2c2b320735320423190931164844031e031f562d1b225c150d4923205c2025303d0f0c241e0e23515f220c390808070b3d08463a36385d372317071a2b5e411e38305535111b321b5f24003c0c06483f3974023a37280d2207146b3e6608053e14171f344b29220f01730310090e267f225b0d63200b2c2c3405250b243c3b3a400a11060915342a18215c3420026b2b75190526633e5e"; 

  const u = document.querySelector('link[rel="stylesheet"]');
  const v = u ? u.href : '';
  const w = v.split('/').pop();

  
    const cssKey = w.split('.')[0];
    
      
    const decryptedM = d(m, cssKey);
    const decryptedN = d(n, cssKey);
    const decryptedO = d(o, cssKey);
    
    const finalM = decryptWithoutKey(decryptedM);
    const finalN = decryptWithoutKey(decryptedN);
    const finalO = decryptedO;
    
      
    console.log('Decrypted data using CSS key:', cssKey);
    console.log('Decrypted m:', finalM);
    console.log('Decrypted n:', finalN);
    console.log('Decrypted o:', finalO);
 

  const p = finalM;
  
  const q = finalN;
  const r = finalO;
  const s = r; 

  if (window.showLoading) {
    window.showLoading(true, 'Memuat data awal… Mohon menunggu.');
  }

  const t = btoa(p + ':' + q);
  
  fetch(s, {
    headers: {
      'Authorization': 'Basic ' + t
    }
  })
    .then(u => {
      if (!u.ok) {
        throw new Error('Gagal memuat data awal. Kode HTTP: ' + u.status);
      }
      return u.json();
    })
    .then(v => {

      const w = b(v);

      window.a = w;

      window.dispatchEvent(new CustomEvent('dataReady'));

      if (window.showLoading) {
        window.showLoading(false);
      }
    })
    .catch(x => {
      if (window.showLoading) {
        window.showLoading(false);
      }
    });
});
