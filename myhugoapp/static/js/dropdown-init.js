// Ensure dropdowns work on all devices
document.addEventListener('DOMContentLoaded', function () {
  // Top-level dropdown toggles
  var dropdowns = document.querySelectorAll('.dropdown-toggle');
  dropdowns.forEach(function (dropdown) {
    dropdown.addEventListener('click', function (e) {
      e.preventDefault();
      var parent = this.parentElement;
      parent.classList.toggle('open');
    });
  });
  // Submenu toggles (dropdown-submenu > a)
  var submenus = document.querySelectorAll('.dropdown-submenu > a');
  submenus.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var parent = this.parentElement;
      parent.classList.toggle('open');
    });
  });
});
