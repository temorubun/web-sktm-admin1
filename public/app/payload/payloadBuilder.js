document.addEventListener('DOMContentLoaded', function () {
  window.buildBasePayload = function (action, message = '') {
    const payload = JSON.parse(JSON.stringify(window.a || {}));
    payload.message = message;
    return payload;
  };
});
