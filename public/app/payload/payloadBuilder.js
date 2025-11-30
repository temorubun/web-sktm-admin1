document.addEventListener('DOMContentLoaded', function () {
  window.buildBasePayload = function (action, message = '') {
    const payload = JSON.parse(JSON.stringify(window.fetchedData || {}));
    payload.message = message;
    return payload;
  };
});
