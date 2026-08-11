// js/intake.js
// Uses fetch() to submit to Formspree so we can control the redirect ourselves.

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('intake-form');
  if (!form) return;

  const serviceSelect = form.querySelector('[name="service"]');
  const nameInput = form.querySelector('[name="name"]');
  const submitBtn = form.querySelector('[type="submit"]');
  const confirm = document.getElementById('intake-confirm');

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // stop normal browser submission

    const service = serviceSelect ? serviceSelect.value : 'explore';
    const name = nameInput ? nameInput.value.trim() : '';

    // Build form data, injecting dynamic subject
    const data = new FormData(form);
    data.set('_subject', `New MoveWell inquiry — ${name} — ${service}`);
    // Remove _next so Formspree doesn't try to redirect on its own
    data.delete('_next');

    // Disable button to prevent double-submit
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    })
      .then(function (response) {
        if (response.ok) {
          // Show the thank-you screen in place of the form
          if (confirm) {
            form.hidden = true;
            confirm.hidden = false;
            confirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          return response.json().then(function (err) {
            throw new Error(err.error || 'Submission failed');
          });
        }
      })
      .catch(function (err) {
        console.error('Form submission error:', err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'SUBMIT';
        }
        alert('Something went wrong. Please try again or email us directly at info@movewellsportsmed.com');
      });
  });
});
