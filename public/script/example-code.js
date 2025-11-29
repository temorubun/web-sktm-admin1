
/* ===== Dynamic Webhook ===== */
const ENDPOINT_MAP = {
  x1: 'webhook',
  x2: 'urlpost', 
  x3: 'webhook_url',
  x4: 'WEBHOOK',
  x5: 'PESAN',
  x6: 'webhook_kirim_surat',
  x7: 'webhook_hapus_surat',
  x8: 'webhook_kirim_pesan'
};

// Action-specific endpoint mapping
const ACTION_ENDPOINTS = {
  'SEND_MESSAGE': 'webhook_kirim_pesan',
  'CREATE_AND_SEND': 'webhook',
  'DELETE_ALL': 'webhook',
  'UPLOAD_FILES': 'webhook',
  'DELETE_DOCS': 'webhook'
};

function getWebhookUrl(action = null){
  
  if (!lastObj || typeof lastObj !== 'object') {
    console.error('lastObj is not valid:', lastObj);
    return null;
  }
  
  // If action is specified, try to get action-specific endpoint first
  if (action && ACTION_ENDPOINTS[action]) {
    const actionField = ACTION_ENDPOINTS[action];
    // Check integrasi object first for action-specific webhooks
    if (lastObj?.integrasi?.[actionField]) {
      return lastObj.integrasi[actionField];
    }
    if (lastObj[actionField]) return lastObj[actionField];
  }
  
  // Check integration fields first
  if (action === 'CREATE_AND_SEND' && lastObj?.integrasi?.webhook_kirim_surat) {
    return lastObj.integrasi.webhook_kirim_surat;
  }
  
  if (action === 'DELETE_ALL' && lastObj?.integrasi?.webhook_hapus_surat) {
    return lastObj.integrasi.webhook_hapus_surat;
  }
  
  // Fallback to general webhook endpoints
  for (const [key, field] of Object.entries(ENDPOINT_MAP)) {
    // Check in integrasi object first
    const integrasiValue = lastObj?.integrasi?.[field];
    if (integrasiValue) {
      return integrasiValue;
    }
    
    // Then check at root level
    if (lastObj[field]) return lastObj[field];
  }
  
  console.error('No webhook URL found in any field');
  return null;
}
const UPDATE_STRATEGY = 'OVERWRITE_BIN';
const POLL_MS = 500;

/* ===== Config & Data Source ===== */
const META_CONFIG = {
  x7k: "{{ $json.data_web.admin1.id.json }}",
  p9m: "https://distrikwania.com/json/",
  w2n: "id_admin1",
  z5f: /\{\{\s*\$json\.id_admin1\s*\}\}/,
  h8r: ['id_admin1', 'id', 'ref', 'key', 'token'],
  q3t: function(s) { return (s||"").toString().trim(); },
  // Decoy variables to confuse
  userId: 'user',
  sessionId: 'session', 
  authToken: 'token',
  apiKey: 'key'
};

// Obfuscated function names
const fn = {
  extract: 'extractDataRef',
  resolve: 'resolveParameter',
  validate: 'validateInput'
};

function extractDataRef(){
  const raw = META_CONFIG.x7k;
  
  if(META_CONFIG.z5f.test(raw)){
    const urlObj = new URL(location.href);
    
    for(const param of META_CONFIG.h8r){
      const val = urlObj.searchParams.get(param);
      if(val) return META_CONFIG.q3t(val);
    }
    
    const segments = urlObj.pathname.split('/').filter(Boolean);
    if(segments.length) return segments[segments.length-1];
    return "";
  }
  
  const result = META_CONFIG.q3t(raw);
  return result;
}

const DATA_REF = extractDataRef();
const API_ENDPOINT = DATA_REF ? (META_CONFIG.p9m + encodeURIComponent(DATA_REF)) : "";

/* ===== Utils ===== */
const $=id=>document.getElementById(id);
const toStr=(x,fb='-')=>{const v=(x??'').toString().trim();return v.length?v:fb;}
const isJSONResponse=res=>(res.headers.get('content-type')||'').toLowerCase().includes('application/json');
async function hashText(txt){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');}
function pickObj(root){if(!root)return{}; if(Array.isArray(root?.data)&&root.data[0])return root.data[0]; if(Array.isArray(root)&&root[0])return root[0]; return root;}
function humanSize(bytes){if(!bytes&&bytes!==0)return null; const u=['B','KB','MB','GB']; let i=0, n=Number(bytes); while(n>=1024&&i<u.length-1){n/=1024;i++} return (Math.round(n*10)/10)+' '+u[i];}

/* ===== State ===== */
let lastJSON=null,lastObj={},lastHash=null;
let editMode=false,pollHandle=null,pendingFiles=[];
let firstLoadDone=false;

/* ===== View Map ===== */
const VIEW={logo:$("LogoURL"),date:$("date"),from:$("WAHA_Trigger_payload_from_user"),tahun:$("tahun"),
  nama:$("nama"),nik:$("nik"),ttl:$("ttl"),agama:$("agama"),jenis_kelamin:$("jenis_kelamin"),status_perkawinan:$("status_perkawinan"),
  pekerjaan:$("pekerjaan"),alamat:$("alamat"),kelurahan:$("kelurahan"),kecamatan:$("kecamatan"),kota_kab:$("kota_kab"),provinsi:$("provinsi"),
  ket_kel:$("keterangan_kelurahan"),filesList:$("uploadedFilesList")};
const EDIT={nama:$("editNama"),nik:$("editNIK"),ttl:$("editTTL"),agama:$("editAgama"),jk:$("editJenisKelamin"),
  status:$("editStatusPerkawinan"),pekerjaan:$("editPekerjaan"),alamat:$("editAlamat"),
  kelurahan:$("editKelurahan"),kecamatan:$("editKecamatan"),kota_kab:$("editKotaKab"),provinsi:$("editProvinsi")};
const elFileInput=$("fileInput"), elFileInfo=$("fileInfo"), elUploadBtn=$("uploadBtn");
const elProg=$("uploadProgress"), elProgBar=$("uploadProgressBar");
const loadingOverlay=$("loadingOverlay"), loadingText=$("loadingText");

/* ===== Render ===== */
function renderStatic(){ if(VIEW.tahun) VIEW.tahun.textContent=String(new Date().getFullYear()); }

// Helper function to extract location name without prefix
function extractLocationName(value) {
  if (!value) return '';
  
  // Remove "Kelurahan " or "Kampung " prefix
  if (value.startsWith('Kelurahan ')) {
    return value.substring(10); // Remove "Kelurahan " (10 characters)
  }
  if (value.startsWith('Kampung ')) {
    return value.substring(8); // Remove "Kampung " (8 characters)
  }
  
  // Return as-is if no prefix found (legacy data)
  return value;
}

// Helper function to format text with proper capitalization (only first letter capitalized)
function formatProperCase(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
}

// Helper functions to validate field values against select options
function validateGenderValue(value) {
  const validGenders = ['Laki-Laki', 'Perempuan'];
  if (!value) return '';
  
  // Case-sensitive match first
  if (validGenders.includes(value)) {
    return value;
  }
  
  // Case-insensitive match
  const match = validGenders.find(g => g.toLowerCase() === value.toLowerCase());
  if (match) {
    return match;
  }
  
  return '';
}

function validateMarriageStatusValue(value) {
  const validStatuses = ['BELUM KAWIN', 'KAWIN', 'CERAI HIDUP', 'CERAI MATI'];
  if (!value) return '';
  
  // Case-sensitive match first
  if (validStatuses.includes(value)) {
    return formatProperCase(value); // Format to proper case for display
  }
  
  // Case-insensitive match
  const match = validStatuses.find(s => s.toLowerCase() === value.toLowerCase());
  if (match) {
    return formatProperCase(match); // Format to proper case for display
  }
  
  return '';
}

function validateKelurahanValue(value) {
  const validKelurahan = [
    'Kelurahan Inauga', 'Kelurahan Kamoro Jaya', 'Kelurahan Wonosari Jaya',
    'Kampung Kadun Jaya', 'Kampung Mandiri Jaya', 'Kampung Mawokau Jaya', 'Kampung Nawaripi',
    // Also accept legacy values without prefix for backward compatibility
    'Inauga', 'Kamoro Jaya', 'Wonosari Jaya', 'Kadun Jaya', 'Mandiri Jaya', 'Mawokau Jaya', 'Nawaripi'
  ];
  if (!value) return '';
  
  // Case-sensitive match first
  if (validKelurahan.includes(value)) {
    // If legacy format (without prefix), convert to new format
    if (value === 'Inauga') return 'Kelurahan Inauga';
    if (value === 'Kamoro Jaya') return 'Kelurahan Kamoro Jaya';
    if (value === 'Wonosari Jaya') return 'Kelurahan Wonosari Jaya';
    if (value === 'Kadun Jaya') return 'Kampung Kadun Jaya';
    if (value === 'Mandiri Jaya') return 'Kampung Mandiri Jaya';
    if (value === 'Mawokau Jaya') return 'Kampung Mawokau Jaya';
    if (value === 'Nawaripi') return 'Kampung Nawaripi';
    return value;
  }
  
  // Case-insensitive match
  const match = validKelurahan.find(k => k.toLowerCase() === value.toLowerCase());
  if (match) {
    // If legacy format (without prefix), convert to new format
    const lowerMatch = match.toLowerCase();
    if (lowerMatch === 'inauga') return 'Kelurahan Inauga';
    if (lowerMatch === 'kamoro jaya') return 'Kelurahan Kamoro Jaya';
    if (lowerMatch === 'wonosari jaya') return 'Kelurahan Wonosari Jaya';
    if (lowerMatch === 'kadun jaya') return 'Kampung Kadun Jaya';
    if (lowerMatch === 'mandiri jaya') return 'Kampung Mandiri Jaya';
    if (lowerMatch === 'mawokau jaya') return 'Kampung Mawokau Jaya';
    if (lowerMatch === 'nawaripi') return 'Kampung Nawaripi';
    return match;
  }
  
  return '';
}

function normalizeDocs(docs){
  const arr=Array.isArray(docs)?docs.filter(Boolean):[];
  const seen=new Set(); const out=[];
  for(const d of arr){
    const fid=d?.file_id||d?.id||d?.fileId||null;
    const hasUrl=!!(d?.view_url||d?.download_url);
    if(!fid && !hasUrl) continue;
    const key=fid?`fid:${fid}`:`name:${(d?.name||d?.nama_file||'').toLowerCase()}|size:${d?.size||d?.ukuran||0}`;
    if(seen.has(key)) continue; seen.add(key);
    out.push({
      label:d?.label??d?.name??d?.nama_file??'-',
      name:d?.name??d?.nama_file??d?.label??'-',
      file_id:fid,
      view_url:d?.view_url??null,
      download_url:d?.download_url??null,
      size: d?.size ?? d?.ukuran ?? null,
      mimeType: d?.mimeType ?? d?.tipe ?? d?.mime ?? null
    });
  }
  return out;
}

function renderFiles(obj){
  const wrap=VIEW.filesList; if(!wrap) return;
  // Handle both dokumen and documents field names
  const docs=normalizeDocs(obj?.dokumen || obj?.documents);
  wrap.innerHTML='';
  updateCreateSendButton(docs.length > 0);
  if(!docs.length){
    const div=document.createElement('div'); div.className='no-files-message'; div.textContent='Belum ada file yang diupload'; wrap.appendChild(div); return;
  }
  docs.forEach(d=>{
    const row=document.createElement('div'); row.className='uploaded-file-item';
    const nameEl=document.createElement('div'); nameEl.className='file-name'; nameEl.textContent=toStr(d.name,'(tanpa nama)'); row.appendChild(nameEl);
    const metaParts=[]; if(d.size!=null) metaParts.push('Ukuran: '+humanSize(d.size)); if(d.mimeType) metaParts.push(d.mimeType);
    const metaEl=document.createElement('div'); metaEl.className='file-meta'; metaEl.textContent=metaParts.join(' • ')||'—'; row.appendChild(metaEl);
    const act=document.createElement('div'); act.className='file-actions';
    if(d.view_url){ const a=document.createElement('a'); a.href=d.view_url; a.target='_blank'; a.rel='noopener'; a.textContent='👁️ Lihat'; a.className='btn success'; act.appendChild(a); }
    if(d.download_url || d.view_url){ 
      const b=document.createElement('a'); 
      b.href=d.download_url || d.view_url; 
      b.download=''; 
      b.target='_blank'; 
      b.rel='noopener'; 
      b.textContent='💾 Download'; 
      b.className='btn secondary'; 
      act.appendChild(b); 
    }
    row.appendChild(act);
    wrap.appendChild(row);
  });
}

function renderView(obj){
  // Fixed date field - using tanggal_surat from data_surat_user if available, otherwise current date
  if(VIEW.date) {
    const tanggalSurat = obj?.data_surat_user?.tanggal_surat || obj?.tanggal_surat || new Date().toLocaleDateString('id-ID');
    VIEW.date.textContent = toStr(tanggalSurat, new Date().toLocaleDateString('id-ID'));
  }
  
  // Fixed WAHA trigger payload field - using whatsapp_user.from_user
  if(VIEW.from) {
    const fromUser = obj?.whatsapp_user?.from_user || obj?.WAHA_Trigger_payload_from_user || '—';
    VIEW.from.textContent = toStr(fromUser, '—');
  }
  // Fixed logo URL - using branding.logo_url from the JSON data
  if(VIEW.logo){ 
    const logo = obj?.branding?.logo_url || obj.LogoURL || obj.logo_url || ''; 
    if(logo) VIEW.logo.src = logo; 
  }
  
  // Check status and disable buttons if letter has been sent
  checkStatusAndDisableButtons(obj);

  // Handle the pemohon data structure
  const p=obj.pemohon||{};
  VIEW.nama&&(VIEW.nama.textContent=formatProperCase(toStr(p.nama)));
  VIEW.nik&&(VIEW.nik.textContent=toStr(p.nik));
  VIEW.ttl&&(VIEW.ttl.textContent=formatProperCase(toStr(p.ttl)));
  VIEW.agama&&(VIEW.agama.textContent=formatProperCase(toStr(p.agama)));
  
  // Filter and validate Jenis Kelamin - only display if valid
  if(VIEW.jenis_kelamin) {
    const validGender = validateGenderValue(p.jenis_kelamin);
    VIEW.jenis_kelamin.textContent = toStr(validGender);
  }
  
  // Filter and validate Status Perkawinan - only display if valid
  if(VIEW.status_perkawinan) {
    const validStatus = validateMarriageStatusValue(p.status_perkawinan);
    VIEW.status_perkawinan.textContent = toStr(validStatus);
  }
  VIEW.pekerjaan&&(VIEW.pekerjaan.textContent=formatProperCase(toStr(p.pekerjaan)));
  VIEW.alamat&&(VIEW.alamat.textContent=formatProperCase(toStr(p.alamat)));
  
  // Filter and validate Kelurahan/Kampung - only display location name without prefix
  if(VIEW.kelurahan) {
    const kelurahanValue = p['kelurahan/kampung'] || p.kelurahan_kampung || p.kelurahan;
    const validKelurahan = validateKelurahanValue(kelurahanValue);
    const locationName = extractLocationName(validKelurahan);
    VIEW.kelurahan.textContent = toStr(locationName);
  }
  
  VIEW.kecamatan&&(VIEW.kecamatan.textContent=formatProperCase(toStr(p.kecamatan)));
  VIEW.kota_kab&&(VIEW.kota_kab.textContent=formatProperCase(toStr(p.kota_kabupaten)));
  VIEW.provinsi&&(VIEW.provinsi.textContent=formatProperCase(toStr(p.provinsi)));
  
  // Filter and validate Kelurahan for keterangan section - display location name without prefix
  if(VIEW.ket_kel) {
    const kelurahanValue = p['kelurahan/kampung'] || p.kelurahan_kampung || p.kelurahan;
    const validKelurahan = validateKelurahanValue(kelurahanValue);
    const locationName = extractLocationName(validKelurahan);
    VIEW.ket_kel.textContent = toStr(locationName);
  }

  // Update edit fields
  EDIT.nama&&(EDIT.nama.value=p.nama??''); 
  EDIT.nik&&(EDIT.nik.value=p.nik??''); 
  EDIT.ttl&&(EDIT.ttl.value=p.ttl??'');
  EDIT.agama&&(EDIT.agama.value=p.agama??''); 
  EDIT.jk&&(EDIT.jk.value=p.jenis_kelamin??'LAKI-LAKI');
  
  // Fix status perkawinan field - ensure proper value selection
  if(EDIT.status) {
    const statusValue = p.status_perkawinan ?? 'BELUM KAWIN';
    
    // Clear any previous selection first
    EDIT.status.selectedIndex = -1;
    
    // Find and explicitly select the matching option (case-sensitive search)
    let option = EDIT.status.querySelector(`option[value="${statusValue}"]`);
    
    // If no exact match, try case-insensitive search
    if (!option && statusValue) {
      const options = EDIT.status.querySelectorAll('option');
      option = Array.from(options).find(opt => 
        opt.value && opt.value.toLowerCase() === statusValue.toLowerCase()
      );
    }
    
    if (option) {
      option.selected = true;
      EDIT.status.value = option.value;
    } else {
      // No match found - fallback to first option for marriage status
      if (EDIT.status.options.length > 0) {
        EDIT.status.selectedIndex = 0;
        EDIT.status.value = EDIT.status.options[0].value;
      }
    }
  }
  
  EDIT.pekerjaan&&(EDIT.pekerjaan.value=p.pekerjaan??'');
  EDIT.alamat&&(EDIT.alamat.value=p.alamat??''); 
  
  // Fix kelurahan/kampung field - ensure proper value selection
  if(EDIT.kelurahan) {
    const kelurahanValue = p['kelurahan/kampung'] || p.kelurahan_kampung || p.kelurahan || '';
    
    // Clear any previous selection first
    EDIT.kelurahan.selectedIndex = -1;
    
    // First, normalize the value using validation function
    const normalizedValue = validateKelurahanValue(kelurahanValue);
    
    // Find and explicitly select the matching option (case-sensitive search)
    let option = EDIT.kelurahan.querySelector(`option[value="${normalizedValue}"]`);
    
    // If no exact match, try with original value
    if (!option && kelurahanValue) {
      option = EDIT.kelurahan.querySelector(`option[value="${kelurahanValue}"]`);
    }
    
    // If still no match, try case-insensitive search
    if (!option && kelurahanValue) {
      const options = EDIT.kelurahan.querySelectorAll('option');
      option = Array.from(options).find(opt => 
        opt.value && (opt.value.toLowerCase() === kelurahanValue.toLowerCase() || 
                     opt.value.toLowerCase() === normalizedValue.toLowerCase())
      );
    }
    
    if (option) {
      option.selected = true;
      EDIT.kelurahan.value = option.value;
    } else {
      // No match found - keep empty selection and don't display JSON data
      EDIT.kelurahan.selectedIndex = 0; // Select the empty option
      EDIT.kelurahan.value = '';
    }
  }
  
  EDIT.kecamatan&&(EDIT.kecamatan.value=p.kecamatan??''); 
  EDIT.kota_kab&&(EDIT.kota_kab.value=p.kota_kabupaten??'');
  EDIT.provinsi&&(EDIT.provinsi.value=p.provinsi??'');

  renderFiles(obj);
}

/* ===== Polling ===== */
function startPolling(){stopPolling();pollHandle=setInterval(()=>{if(!editMode)loadOnce(false);},POLL_MS)}
function stopPolling(){if(pollHandle){clearInterval(pollHandle);pollHandle=null}}

/* ===== Loading ===== */
function showLoading(show,text){ if(text) loadingText.textContent=text; loadingOverlay.style.display=show?'flex':'none'; }

/* ===== Modal ===== */
const modalOverlay=$("modalOverlay"), modalBox=$("modalBox");
const modalIcon=$("modalIcon"), modalTitle=$("modalTitle"), modalMessage=$("modalMessage"), modalActions=$("modalActions");
function showModal({icon='ℹ️',title='Informasi',message='',buttons=[{label:'Tutup',variant:'secondary',value:true}],variant='info',closable=true}={}){
  return new Promise(resolve=>{
    modalIcon.textContent=icon; modalTitle.textContent=title; modalMessage.innerHTML=message; modalActions.innerHTML='';
    modalBox.className='modal modal--'+variant;
    buttons.forEach(btn=>{
      const el=document.createElement('button');
      el.className='btn '+(btn.primary?'primary':btn.danger?'danger':btn.variant||'secondary');
      el.textContent=btn.label||'OK';
      el.onclick=()=>{ hide(); resolve(btn.value); };
      modalActions.appendChild(el);
    });
    function onEsc(e){ if(e.key==='Escape' && closable){ hide(); resolve(null);} }
    function hide(){ modalOverlay.style.display='none'; document.removeEventListener('keydown',onEsc); }
    modalOverlay.style.display='flex'; document.addEventListener('keydown',onEsc);
  });
}
function infoModal(title,message){ return showModal({icon:'ℹ️',title,message,variant:'info',buttons:[{label:'Tutup',variant:'secondary',value:true}]}); }
function successModal(title,message){ return showModal({icon:'✅',title,message,variant:'success',buttons:[{label:'Tutup',variant:'secondary',value:true}]}); }
function confirmModal(title,message,{okLabel='Lanjutkan',cancelLabel='Batal',icon='❓',danger=false}={}){
  return showModal({icon,title,message,variant:'confirm',buttons:[{label:cancelLabel,variant:'secondary',value:false},{label:okLabel,primary:!danger,danger, value:true}]});
}

/* ===== Edit ===== */
function toggleEditMode(){ 
  // Check if system is disabled due to letter being sent
  if (window.systemDisabled) {
    showModal({
      icon: '🔒',
      title: 'Mode Edit Tidak Tersedia',
      message: 'Surat telah terkirim. Mode edit telah dinonaktifkan.',
      variant: 'info',
      buttons: [{label: 'Tutup', variant: 'secondary', value: true}]
    });
    return;
  }
  
  editMode=!editMode; 
  document.body.classList.toggle('edit-mode',editMode); 
  const btn=$("editBtn"); 
  if(btn) btn.textContent=editMode?'🔒 Tutup Mode Edit':'✏️ Masuk Mode Edit'; 
  if(editMode) stopPolling(); 
  else {loadOnce(false);startPolling();} 
}
function cancelEdit(){renderView(lastObj||{}); if(editMode) toggleEditMode();}

/* === Konsolidasi struktur payload === */
function baseHref(){ return (new URL(location.href)).href; }
function buildBasePayload(action){
  
  const dataCloned = JSON.parse(JSON.stringify(lastObj||{}));
  if(UPDATE_STRATEGY==='OVERWRITE_BIN') dataCloned.dokumen = normalizeDocs(lastObj?.dokumen || lastObj?.documents);
  
  const payload = {
    action,
    id_admin1: DATA_REF,
    id_surat: baseHref(),
    from: '{{ $json.data_web.admin1.data_surat.admin.jabatan }}',
    data: { ...dataCloned, id_admin1: DATA_REF, id_surat: baseHref() }
  };
  
  return payload;
}
async function sendJSON(action, extras={}){
  
  const targetUrl = getWebhookUrl(action);
  
  if(!targetUrl){
    console.error('No webhook URL found for action:', action);
    console.error('lastObj webhook fields:', {
      webhook: lastObj?.webhook,
      urlpost: lastObj?.urlpost,
      webhook_url: lastObj?.webhook_url,
      WEBHOOK: lastObj?.WEBHOOK,
      PESAN: lastObj?.PESAN
    });
    throw new Error('Service endpoint not configured. Please verify configuration settings.');
  }
  
  const payload = { ...buildBasePayload(action), action: action, ...extras };
  
  const resp = await fetch(targetUrl,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const text = await resp.text();
  
  if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
  return text;
}

async function saveChanges(){
  try{
    if(!lastObj||typeof lastObj!=='object') lastObj={}; if(!lastObj.pemohon) lastObj.pemohon={};
    const p=lastObj.pemohon;
    p.nama=EDIT.nama?.value??p.nama; p.nik=EDIT.nik?.value??p.nik; p.ttl=EDIT.ttl?.value??p.ttl; p.agama=EDIT.agama?.value??p.agama;
    p.jenis_kelamin=EDIT.jk?.value??p.jenis_kelamin; p.status_perkawinan=EDIT.status?.value??p.status_perkawinan;
    p.pekerjaan=EDIT.pekerjaan?.value??p.pekerjaan; p.alamat=EDIT.alamat?.value??p.alamat;
    p['kelurahan/kampung']=EDIT.kelurahan?.value??p['kelurahan/kampung']??p.kelurahan_kampung??p.kelurahan; p.kecamatan=EDIT.kecamatan?.value??p.kecamatan;
    p.kota_kab=EDIT.kota_kab?.value??p.kota_kabupaten??p.kota_kab; p.provinsi=EDIT.provinsi?.value??p.provinsi;

    showLoading(true,'Menyimpan perubahan data ke server…');
    await sendJSON('UPDATE_ONLY', { strategy: UPDATE_STRATEGY });
    renderView(lastObj); if(editMode) toggleEditMode();
    await successModal('Perubahan Disimpan','Perubahan data telah berhasil disimpan di server.');
  }catch(e){
    await showModal({icon:'⚠️',title:'Gagal Menyimpan',message:'Terjadi kendala saat menyimpan perubahan.<br><span class="mono">'+(e.message||e)+'</span>',variant:'danger',buttons:[{label:'Tutup',variant:'secondary',value:true}]});
  }finally{ showLoading(false); }
}

/* ===== Load JSON ===== */
async function loadOnce(showLoader=true){
  try{
    if(!API_ENDPOINT){ 
      console.error('API_ENDPOINT is empty:', API_ENDPOINT);
      console.error('DATA_REF:', DATA_REF);
      return; 
    }
    if(showLoader && !firstLoadDone) showLoading(true,'Memuat data… Mohon menunggu.');
    const res=await fetch(API_ENDPOINT+'?t='+Date.now(),{cache:'no-store'});
    const text=await res.text();
    if(!res.ok) throw new Error('HTTP '+res.status+' — '+text.slice(0,200));
    let data; try{data=JSON.parse(text);}catch(err){ 
      console.error('JSON Parse Error:', err);
      console.error('Response text:', text.slice(0, 500));
      if(!isJSONResponse(res)) throw new Error('Respon bukan JSON'); 
      throw err; 
    }
    const h=await hashText(JSON.stringify(data));
    if(h!==lastHash){
      lastHash=h; 
      lastJSON=data; 
      lastObj=pickObj(data)||{}; 
      renderView(lastObj);
    } 
    if(!firstLoadDone){firstLoadDone=true; showLoading(false);} 
  }catch(e){
    console.error('LoadOnce error:', e);
    if(!firstLoadDone){
      showLoading(false);
      await showModal({icon:'⚠️',title:'Gagal Memuat Data',message:'Sistem tidak dapat memuat data awal.<br><span class="mono">'+(e.message||e)+'</span>',variant:'danger',buttons:[{label:'Tutup',variant:'secondary',value:true}]});
    }
  }
}
function startRealtime(){renderStatic();loadOnce(true);startPolling();}

/* ===== Create / Delete Surat ===== */
async function confirmCreateAndSend(){
  const docs = normalizeDocs(lastObj?.dokumen || lastObj?.documents);
  if(!docs || docs.length === 0){
    await showModal({ icon:'⚠️', title:'Belum Ada File yang Dilampirkan', message:'Silakan upload minimal satu file pendukung sebelum membuat surat.', variant:'danger', buttons:[{label:'Tutup',variant:'secondary',value:true}] });
    return;
  }
  const ok = await confirmModal('Konfirmasi Pembuatan Surat','Dengan menekan <b>Setujui & Proses</b>, sistem akan membuat dokumen berdasarkan data saat ini dan mengirimkannya.',{okLabel:'Setujui & Proses',cancelLabel:'Tinjau Kembali',icon:'📨'});
  if(!ok) return;
  await generateAndSendLetter();
}
async function generateAndSendLetter(){
  try{
    if(editMode) await saveChanges();
    showLoading(true,'Memproses pembuatan surat dan pengiriman data…');
    await sendJSON('CREATE_AND_SEND');
    await successModal('Surat Berhasil Dibuat','Data dan surat telah dikirim untuk verifikasi.');
  }catch(e){
    await showModal({icon:'⚠️',title:'Gagal Membuat Surat',message:'Terjadi kendala saat membuat atau mengirim surat.<br><span class="mono">'+(e.message||e)+'</span>',variant:'danger',buttons:[{label:'Tutup',variant:'secondary',value:true}]});
  }finally{ showLoading(false); }
}

async function confirmDeleteAll(){
  const ok = await showModal({ icon:'🗑️',title:'Konfirmasi Penghapusan', message:'Tindakan ini akan <b>menghapus seluruh data dan surat</b> terkait referensi ini. Lanjutkan?', variant:'confirm', buttons:[ {label:'Batal',variant:'secondary',value:false}, {label:'Ya, Hapus Semua',danger:true,value:true} ] });
  if(!ok) return; await deleteLetterAndData();
}
async function deleteLetterAndData(){
  try{
    showLoading(true,'Menghapus surat dan seluruh data terkait…');
    
    await performDeleteAll();
    
    await successModal('Penghapusan Berhasil','Surat dan seluruh data terkait telah dihapus dari sistem.');
    location.reload();
  }catch(e){
    await showModal({ icon:'⚠️', title:'Gagal Menghapus', message:'Terjadi kendala saat menghapus surat atau data.<br><span class="mono">'+(e.message||e)+'</span>', variant:'danger', buttons:[{label:'Tutup',variant:'secondary',value:true}] }).then(()=>location.reload());
  }finally{ showLoading(false); }
}

/* ===== Internal Delete Function ===== */
async function performDeleteAll(){
  const targetUrl = getWebhookUrl('DELETE_ALL');
  if(!targetUrl){
    throw new Error('Service endpoint not configured. Please verify configuration settings.');
  }

  // Use the exact same structure as SEND_MESSAGE
  const payload = {
    action: 'DELETE_ALL',
    id_admin1: DATA_REF,
    id_surat: baseHref(),
    from: '{{ $json.data_web.admin1.data_surat.admin.jabatan }}',
    json: lastObj || {},
    data: lastObj || {},
    meta: { ref: lastObj?.ref || DATA_REF, operator: lastObj?.operator || null, at: new Date().toISOString() }
  };


  const resp = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await resp.text();
  
  if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
  
  return text;
}

/* ===== Upload ===== */
function handleFileSelect(ev){pendingFiles=Array.from(ev.target.files||[]);refreshPendingFilesUI();}
function handleDragOver(ev){ev.preventDefault();ev.stopPropagation();ev.currentTarget.style.borderColor='rgba(56,189,248,.6)';ev.currentTarget.style.background='rgba(56,189,248,.06)';}
function handleDragLeave(ev){ev.preventDefault();ev.stopPropagation();ev.currentTarget.style.borderColor='';ev.currentTarget.style.background='';}
function handleDrop(ev){ev.preventDefault();ev.stopPropagation();ev.currentTarget.style.borderColor='';ev.currentTarget.style.background='';pendingFiles=Array.from(ev.dataTransfer.files||[]);refreshPendingFilesUI();}
function refreshPendingFilesUI(){ if(!elFileInfo||!elUploadBtn) return; if(!pendingFiles.length){elFileInfo.style.display='none';elUploadBtn.style.display='none';return;} elFileInfo.style.display=''; elUploadBtn.style.display=''; elFileInfo.innerHTML = '<div style="font-weight:600;margin-bottom:6px">File akan diunggah:</div>' + pendingFiles.map(f => `<div style="font-size:12px; margin-bottom:8px">• ${f.name}</div>`).join(''); }
async function uploadFiles(){
  try{
    if(!pendingFiles.length) return infoModal('Tidak Ada File','Silakan pilih minimal satu file untuk diunggah.');
    if(!lastObj && !lastJSON) return infoModal('Data Utama Belum Ada','Muat ulang halaman, lalu coba kembali.');
    if(editMode) await saveChanges();

    const form=new FormData();
    form.append('action','UPLOAD_FILES');
    form.append('id_admin1', DATA_REF);
    form.append('id_surat', baseHref());
    form.append('from', '{{ $json.data_web.admin1.data_surat.admin.jabatan }}');
    form.append('data', JSON.stringify({ ...((lastObj)||{}), id_admin1: DATA_REF, id_surat: baseHref() }));
    pendingFiles.forEach(f=>form.append('files[]',f,f.name));

    if(elProg) elProg.style.display=''; if(elProgBar) elProgBar.style.width='8%';
    const targetUrl = getWebhookUrl('UPLOAD_FILES');
    if(!targetUrl){
      throw new Error('Service endpoint not configured. Please verify configuration settings.');
    }
    showLoading(true,'Mengunggah berkas…');
    const resp=await fetch(targetUrl,{method:'POST',body:form}); const text=await resp.text();
    if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
    if(elProgBar) elProgBar.style.width='100%';
    await successModal('Unggah Berhasil','Berkas berhasil diunggah dan ditautkan ke data pemohon.');

    pendingFiles=[]; if(elFileInput) elFileInput.value=''; refreshPendingFilesUI(); await loadOnce(false);
  }catch(e){
    await showModal({icon:'⚠️',title:'Unggah Gagal',message:'Terjadi kendala saat mengunggah berkas.<br><span class="mono">'+(e.message||e)+'</span>',variant:'danger',buttons:[{label:'Tutup',variant:'secondary',value:true}]});
  }finally{ setTimeout(()=>{if(elProg) elProg.style.display='none';},600); if(elProgBar) elProgBar.style.width='0%'; showLoading(false); }
}

/* ===== Hapus Dokumen ===== */
async function confirmDeleteDocs(docs=[]){
  if(!docs.length) return;
  const listHtml=docs.map(d=>{ const sizeTxt = d.size!=null ? humanSize(d.size) : '—'; return `📄 <b>${toStr(d.name,'(tanpa nama)')}</b><br>Ukuran: ${sizeTxt}${d.mimeType?(' • '+d.mimeType):''}<br>ID: <span class="mono">${toStr(d.file_id,'—')}</span>`; }).join('<hr style="border:0;border-top:1px solid rgba(148,163,184,.25);margin:8px 0">');
  const ok = await showModal({ icon:'🗂️', title:'Konfirmasi Penghapusan Dokumen', message:`Dokumen berikut akan dihapus dari sistem:<br><br>${listHtml}<br><br>Tindakan ini tidak dapat dibatalkan. Lanjutkan?`, variant:'confirm', buttons:[ {label:'Batal',variant:'secondary',value:false}, {label:'Hapus Dokumen',danger:true,value:true} ] });
  if(!ok) return; await deleteDocumentsByFileIds(docs.map(d=>d.file_id).filter(Boolean));
}
async function deleteDocumentsByFileIds(fileIds=[]){
  if(!fileIds.length) return;
  try{
    showLoading(true,'Menghapus dokumen terpilih…');
    await sendJSON('DELETE_DOCS', { delete_file_ids: fileIds });
    await loadOnce(false);
    await successModal('Dokumen Dihapus','Dokumen terpilih telah berhasil dihapus dari sistem.');
  }catch(e){
    await showModal({icon:'⚠️',title:'Gagal Menghapus Dokumen',message:'Terjadi kendala saat menghapus dokumen.<br><span class="mono">'+(e.message||e)+'</span>',variant:'danger',buttons:[{label:'Tutup',variant:'secondary',value:true}]});
  }finally{ showLoading(false); }
}

/* ===== File Validation ===== */
function updateCreateSendButton(hasFiles = false){ const btn=$("createSendBtn"); if(!btn) return; btn.style.opacity = hasFiles ? '1' : '0.5'; btn.style.cursor = hasFiles ? 'pointer' : 'not-allowed'; btn.disabled = !hasFiles; }

/* ===== Status Check & Button Disable ===== */
function checkStatusAndDisableButtons(obj) {
  const status = obj?.status_web_admin1 || obj?.status_web_admin2 || '';
  const isLetterSent = status.toLowerCase().includes('terkirim');
  
  if (isLetterSent) {
    disableAllButtons();
    showStatusMessage('Surat telah terkirim');
  } else {
    enableAllButtons();
  }
}

/* ===== Show Reject Modal with Notes ===== */
async function showRejectModal(){
  return new Promise(resolve => {
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
      const noteText = document.getElementById('rejectNoteText').value.trim();
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
    // First send the note
    showLoading(true, 'Mengirim catatan penolakan…');
    
    const targetUrl = getWebhookUrl('SEND_MESSAGE');
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

/* ===== Internal Delete Function ===== */
async function performDeleteAll(){
  const targetUrl = getWebhookUrl('DELETE_ALL');
  if(!targetUrl){
    throw new Error('Service endpoint not configured. Please verify configuration settings.');
  }

  // Use the exact same structure as SEND_MESSAGE
  const payload = {
    action: 'DELETE_ALL',
    id_admin1: DATA_REF,
    id_surat: baseHref(),
    from: '{{ $json.data_web.admin1.data_surat.admin.jabatan }}',
    json: lastObj || {},
    data: lastObj || {},
    meta: { ref: lastObj?.ref || DATA_REF, operator: lastObj?.operator || null, at: new Date().toISOString() }
  };


  const resp = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await resp.text();
  
  if(!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));
  
  return text;
}

/* ===== Kirim Catatan / Pesan (kept for compatibility) ===== */
async function sendNote(){
  try{
    const textNote=( $('noteText').value || '' ).trim();
    if(!textNote) return infoModal('Catatan Kosong','Silakan tulis catatan terlebih dahulu.');

    const ok = await confirmModal(
      'Kirim Pesan kepada Pemohon',
      'Pesan berikut akan dikirim:<br><br><i>"'+textNote.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'"</i>',
      { okLabel:'Kirim Sekarang', cancelLabel:'Batal', icon:'✉️' }
    );
    if(!ok) return;

    showLoading(true,'Mengirim pesan…');

    const targetUrl = getWebhookUrl('SEND_MESSAGE');
    if(!targetUrl){
      throw new Error('Service endpoint not configured. Please verify configuration settings.');
    }

    const payload={
      action: 'SEND_MESSAGE',
      id_admin1: DATA_REF,
      id_surat: baseHref(),
      message: textNote,
      from: '{{ $json.data_web.admin1.data_surat.admin.jabatan }}',
      json: lastObj || {},
      data: lastObj || {},
      meta: { ref: lastObj?.ref || DATA_REF, operator: lastObj?.operator || null, at: new Date().toISOString() }
    };

    const resp=await fetch(targetUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const bodyText=await resp.text();
    if(!resp.ok){ throw new Error('HTTP '+resp.status+' — '+bodyText.slice(0,200)); }

    $('noteText').value='';
    await successModal('Pesan Terkirim','Catatan/instruksi berhasil dikirim ke sistem.');
  }catch(e){
    await showModal({
      icon:'⚠️',
      title:'Gagal Mengirim Pesan',
      message:'Tidak dapat mengirim pesan.<br><span class="mono">'+(e.message||e)+'</span>',
      variant:'danger',
      buttons:[{label:'Tutup',variant:'secondary',value:true}]
    });
  }finally{ showLoading(false); }
}

function disableAllButtons() {
  
  // Disable specific buttons by ID
  const specificButtons = [
    'createSendBtn',    // Tombol kirim surat dan data
    'editBtn',          // Tombol edit
    'uploadBtn'         // Tombol upload
  ];
  
  specificButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = true;
      button.classList.add('disabled');
    }
  });
  
  // Disable all buttons with specific onclick functions
  const functionalButtons = document.querySelectorAll('button[onclick], .btn[onclick]');
  functionalButtons.forEach(button => {
    button.disabled = true;
    button.classList.add('disabled');
    // Remove click handlers
    const originalOnclick = button.onclick;
    button.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      showModal({
        icon: '🔒',
        title: 'Aksi Tidak Tersedia',
        message: 'Surat telah terkirim. Semua tombol telah dinonaktifkan.',
        variant: 'info',
        buttons: [{label: 'Tutup', variant: 'secondary', value: true}]
      });
      return false;
    };
    button.setAttribute('data-original-onclick', originalOnclick ? originalOnclick.toString() : '');
  });
  
  // Disable all delete document buttons (dynamically created)
  const deleteDocButtons = document.querySelectorAll('.file-actions .btn.danger');
  deleteDocButtons.forEach(button => {
    button.disabled = true;
    button.classList.add('disabled');
    button.onclick = function(e) {
      e.preventDefault();
      showModal({
        icon: '🔒',
        title: 'Hapus Dokumen Tidak Tersedia',
        message: 'Surat telah terkirim. Dokumen tidak dapat dihapus.',
        variant: 'info',
        buttons: [{label: 'Tutup', variant: 'secondary', value: true}]
      });
    };
  });
  
  // Disable file input
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.disabled = true;
  }
  
  // Disable file upload container drag and drop
  const uploadContainer = document.querySelector('.file-upload-container');
  if (uploadContainer) {
    uploadContainer.style.pointerEvents = 'none';
    uploadContainer.style.opacity = '0.5';
    uploadContainer.ondragover = null;
    uploadContainer.ondragleave = null;
    uploadContainer.ondrop = null;
  }
  
  // Disable edit mode if active and prevent future edit mode activation
  if (editMode) {
    document.body.classList.remove('edit-mode');
    editMode = false;
  }
  
  // Mark system as disabled to prevent edit mode activation
  window.systemDisabled = true;
}

function enableAllButtons() {
  
  // Enable specific buttons by ID
  const specificButtons = [
    'createSendBtn',    // Tombol kirim surat dan data
    'editBtn',          // Tombol edit
    'uploadBtn'         // Tombol upload
  ];
  
  specificButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = false;
      button.classList.remove('disabled');
    }
  });
  
  // Enable all buttons and restore original onclick functions
  const functionalButtons = document.querySelectorAll('button[onclick], .btn[onclick]');
  functionalButtons.forEach(button => {
    button.disabled = false;
    button.classList.remove('disabled');
    
    // Restore original onclick if it was saved
    const originalOnclick = button.getAttribute('data-original-onclick');
    if (originalOnclick && originalOnclick !== '') {
      try {
        button.onclick = new Function(originalOnclick);
      } catch (e) {
        // Could not restore original onclick
      }
    }
    button.removeAttribute('data-original-onclick');
  });
  
  // Enable file input
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.disabled = false;
  }
  
  // Enable file upload container drag and drop
  const uploadContainer = document.querySelector('.file-upload-container');
  if (uploadContainer) {
    uploadContainer.style.pointerEvents = '';
    uploadContainer.style.opacity = '';
    uploadContainer.ondragover = handleDragOver;
    uploadContainer.ondragleave = handleDragLeave;
    uploadContainer.ondrop = handleDrop;
  }
  
  // Mark system as enabled
  window.systemDisabled = false;
}

function showStatusMessage(message) {
  // Create or update status message
  let statusDiv = document.getElementById('statusMessage');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'statusMessage';
    statusDiv.style.cssText = `
      background: rgba(34,197,94,.1);
      border: 1px solid rgba(34,197,94,.35);
      border-radius: 12px;
      padding: 12px 14px;
      margin: 14px 0;
      font-size: 14px;
      color: #d1fae5;
      text-align: center;
      font-weight: 700;
      animation: slideIn 0.5s ease-out;
    `;
    
    // Insert after the brand section
    const topbar = document.querySelector('.topbar');
    if (topbar && topbar.nextSibling) {
      topbar.parentNode.insertBefore(statusDiv, topbar.nextSibling);
    }
  }
  
  statusDiv.innerHTML = `🟢 ${message}`;
  statusDiv.style.display = 'block';
  
  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  if (!document.querySelector('style[data-status-animation]')) {
    style.setAttribute('data-status-animation', 'true');
    document.head.appendChild(style);
  }
}

/* ================= 18) START ================= */
// Expose modal functions
window.showModal=showModal; window.infoModal=infoModal; window.successModal=successModal; window.confirmModal=confirmModal;
// Expose loading function
window.showLoading=showLoading;
// Expose payload functions
window.sendJSON=sendJSON; window.getWebhookUrl=getWebhookUrl; window.baseHref=baseHref; window.buildBasePayload=buildBasePayload;
// Expose data references
window.DATA_REF=DATA_REF; window.lastObj=lastObj;
// Expose action functions
window.performDeleteAll=performDeleteAll;
// Expose edit functions
window.toggleEditMode=toggleEditMode; window.saveChanges=saveChanges; window.cancelEdit=cancelEdit;
// Expose button functions
window.uploadFiles=uploadFiles; window.confirmCreateAndSend=confirmCreateAndSend; window.confirmDeleteAll=confirmDeleteAll;
window.handleFileSelect=handleFileSelect; window.handleDragOver=handleDragOver; window.handleDragLeave=handleDragLeave; window.handleDrop=handleDrop;
window.checkStatusAndDisableButtons=checkStatusAndDisableButtons; window.sendNote=sendNote; window.showRejectModal=showRejectModal;

document.addEventListener('DOMContentLoaded',startRealtime);
