// Ensure dropdowns work on mobile
document.addEventListener('DOMContentLoaded', function () {
  if (window.innerWidth < 768) {
    var dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(function (dropdown) {
      dropdown.addEventListener('click', function (e) {
        e.preventDefault();
        var parent = this.parentElement;
        parent.classList.toggle('open');
      });
    });
  }
});
