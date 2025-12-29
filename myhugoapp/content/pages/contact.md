---
title: "Kontakt"
date: 2025-12-18
---

Haben Sie Fragen oder Anregungen? Wir freuen uns über Ihre Nachricht!

<form action="https://formsubmit.co/spam@tobias-weiss.org" method="POST" style="max-width: 500px; margin-top: 20px;">
  <div class="form-group">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" class="form-control" required>
  </div>
  <div class="form-group">
    <label for="email">E-Mail:</label>
    <input type="email" id="email" name="email" class="form-control" required>
  </div>
  <div class="form-group">
    <label for="subject">Betreff:</label>
    <input type="text" id="subject" name="subject" class="form-control" required>
  </div>
  <div class="form-group">
    <label for="message">Nachricht:</label>
    <textarea id="message" name="message" class="form-control" rows="5" required></textarea>
  </div>
  <!-- Honeypot to prevent spam -->
  <input type="text" name="_honey" style="display:none">
  <!-- Captcha will be shown by Formsubmit.co on first submission -->
  <button type="submit" class="btn btn-primary">Absenden</button>
</form>

<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
  <p style="margin: 0; font-size: 0.9rem; color: #495057;">
    <strong>💡 Hinweis:</strong> Ihre Nachricht wird sicher über Formsubmit.co versendet. Sie erhalten eine Bestätigung per E-Mail.
  </p>
</div>

<script>
// Optional: Client-side form validation enhancement
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form[action*="formsubmit.co"]');
  if (form) {
    form.addEventListener('submit', function(e) {
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;

      if (!email || !message) {
        e.preventDefault();
        alert('Bitte füllen Sie alle Pflichtfelder aus.');
        return false;
      }

      // Show submitting state
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet...';
    });
  }
});
</script>
