/**
 * SEEDSTARS – Forminit consultation form handler (clean single module)
 * Form ID: od1nqrvfyk6
 * User enters 10-digit phone → we send +91XXXXXXXXXX (E.164)
 * Forminit returns HTTP 302 on success for multipart posts – treat as success
 */
(function () {
  'use strict';

  var FORM_URL = 'https://forminit.com/f/od1nqrvfyk6';
  var SUCCESS_MSG = 'Thank you! Seedstars team will contact you soon.';
  var ERROR_MSG = 'We could not submit the form right now. Please use WhatsApp or call +91 90888 73337.';

  function toE164(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;
    if (digits.length === 11 && digits.charAt(0) === '0') digits = '91' + digits.slice(1);
    if (digits.length >= 11) return '+' + digits;
    return '';
  }

  function show(el, text) {
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
  }

  function collectFormData(form, e164Phone) {
    var fd = new FormData();
    var name = form.querySelector('[name="fi-sender-fullName"]');
    var email = form.querySelector('[name="fi-sender-email"]');
    var service = form.querySelector('[name="fi-select-service"]');
    var mode = form.querySelector('[name="fi-select-consultation-mode"]:checked');
    var date = form.querySelector('[name="fi-date-preferred-date"]');
    var time = form.querySelector('[name="fi-text-preferred-time"]');
    var msg = form.querySelector('[name="fi-text-message-requirements"]');

    fd.append('fi-sender-fullName', name ? name.value.trim() : '');
    fd.append('fi-sender-email', email ? email.value.trim() : '');
    fd.append('fi-sender-phone', e164Phone);
    if (service && service.value) fd.append('fi-select-service', service.value);
    if (mode) fd.append('fi-select-consultation-mode', mode.value);
    if (date && date.value) fd.append('fi-date-preferred-date', date.value);
    if (time && time.value) fd.append('fi-text-preferred-time', time.value);
    if (msg && msg.value.trim()) fd.append('fi-text-message-requirements', msg.value.trim());

    form.querySelectorAll('input[type="hidden"][name^="fi-"]').forEach(function (el) {
      if (el.value && !fd.has(el.name)) fd.append(el.name, el.value);
    });
    return fd;
  }

  function validate(form, phoneInput) {
    var err = form.querySelector('.error');
    var name = form.querySelector('[name="fi-sender-fullName"]');
    var email = form.querySelector('[name="fi-sender-email"]');
    var service = form.querySelector('[name="fi-select-service"]');
    var modeInputs = form.querySelectorAll('[name="fi-select-consultation-mode"]');

    if (name && !name.value.trim()) {
      name.focus();
      show(err, 'Please enter your name.');
      return null;
    }
    if (email && !email.value.trim()) {
      email.focus();
      show(err, 'Please enter your email.');
      return null;
    }
    var local = phoneInput ? phoneInput.value.replace(/\D/g, '').slice(0, 10) : '';
    if (phoneInput && !/^\d{10}$/.test(local)) {
      phoneInput.focus();
      show(err, 'Please enter a valid 10-digit mobile number.');
      return null;
    }
    if (service && service.tagName === 'SELECT' && !service.value) {
      service.focus();
      show(err, 'Please select a service.');
      return null;
    }
    if (modeInputs.length && !form.querySelector('[name="fi-select-consultation-mode"]:checked')) {
      show(err, 'Please select Online or Offline consultation.');
      return null;
    }
    return local;
  }

  function isSuccessResponse(res, body) {
    // Forminit success:
    // - 200 + JSON success:true
    // - 302/303 redirect to thank-you (multipart form posts)
    // - opaqueredirect when redirect:manual in some browsers
    if (!res) return false;
    if (res.type === 'opaqueredirect') return true;
    if (res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308) return true;
    if (res.status === 0) return true;
    if (res.ok) {
      if (body && body.success === false) return false;
      return true;
    }
    return false;
  }

  function bindForm(form) {
    if (form.getAttribute('data-fi-ready') === '1') return;
    form.setAttribute('data-fi-ready', '1');
    form.setAttribute('action', FORM_URL);
    form.setAttribute('method', 'POST');

    var phoneInput = form.querySelector('[name="fi-sender-phone"]');
    var status = form.querySelector('.success');
    var err = form.querySelector('.error');
    var btn = form.querySelector('button[type="submit"]');

    if (phoneInput) {
      phoneInput.setAttribute('inputmode', 'numeric');
      phoneInput.setAttribute('maxlength', '10');
      phoneInput.removeAttribute('pattern');
      phoneInput.addEventListener('input', function () {
        phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();
      show(status, '');
      show(err, '');

      var local = validate(form, phoneInput);
      if (local === null) return;

      var e164 = toE164(local);
      if (!e164) {
        show(err, 'Please enter a valid 10-digit mobile number.');
        return;
      }

      var originalLabel = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Sending…';
      }

      var fd = collectFormData(form, e164);

      fetch(FORM_URL, {
        method: 'POST',
        body: fd,
        mode: 'cors',
        credentials: 'omit',
        redirect: 'manual'
      })
        .then(function (res) {
          // Try parse JSON when available (200 responses)
          if (res.status === 200 || res.status === 201) {
            return res.text().then(function (text) {
              var body = null;
              try { body = JSON.parse(text); } catch (e) {}
              return { res: res, body: body };
            });
          }
          return { res: res, body: null };
        })
        .then(function (pack) {
          if (pack.res.status === 429) {
            throw new Error('Please wait a few seconds and try again.');
          }
          if (!isSuccessResponse(pack.res, pack.body)) {
            var m = (pack.body && (pack.body.message || pack.body.error)) || ('Could not submit (HTTP ' + pack.res.status + ')');
            throw new Error(typeof m === 'string' ? m : 'Submission failed');
          }
          show(status, SUCCESS_MSG);
          show(err, '');
          form.reset();
        })
        .catch(function (error) {
          console.error('Forminit error:', error);
          show(err, (error && error.message && /wait/i.test(error.message)) ? error.message : ERROR_MSG);
          show(status, '');
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalLabel || 'Book My Consultation <span>→</span>';
          }
        });
    });
  }

  function init() {
    document.querySelectorAll('form[data-consultation]').forEach(bindForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SEEDSTARS_INIT_FORMS = init;
})();
