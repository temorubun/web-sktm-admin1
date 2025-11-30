document.addEventListener('DOMContentLoaded', function() {
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
    document.head.appendChild(style);
  }

  window.showStatusMessage = showStatusMessage;
});
