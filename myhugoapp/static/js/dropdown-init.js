// Ensure dropdowns work on touch/mobile devices
// On desktop (>=768px) the theme uses CSS hover, no JS needed.
// Uses event delegation to avoid duplicate listener issues on resize.
document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.querySelector('.navbar');
  if (!navbar) return;

  navbar.addEventListener('click', function (e) {
    if (window.innerWidth >= 768) return;

    var target = e.target;
    // Top-level .dropdown-toggle or .dropdown-submenu > a
    if (
      target.classList.contains('dropdown-toggle') ||
      (target.parentElement && target.parentElement.classList.contains('dropdown-submenu'))
    ) {
      e.preventDefault();
      var parent = target.parentElement;
      if (parent) parent.classList.toggle('open');
    }
  });
});
