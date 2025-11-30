const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");
export function showLoading(show, text = "") {
    if (loadingText && text) loadingText.textContent = text;
    if (!loadingOverlay) return;
    loadingOverlay.style.display = show ? "flex" : "none";
}
showLoading(true, "Memuat data awal… Mohon menunggu.");
