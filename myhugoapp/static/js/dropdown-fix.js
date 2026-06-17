document.addEventListener('DOMContentLoaded', function () {
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  dropdownToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      if (window.innerWidth < 768) {
        e.preventDefault();
        const parent = this.parentElement;

        const openDropdowns = document.querySelectorAll('.dropdown.open');
        openDropdowns.forEach(function (openDropdown) {
          if (openDropdown !== parent) {
            openDropdown.classList.remove('open');
          }
        });

        parent.classList.toggle('open');
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.matches('.dropdown-toggle')) {
      const openDropdowns = document.querySelectorAll('.dropdown.open');
      openDropdowns.forEach(function (openDropdown) {
        openDropdown.classList.remove('open');
      });
    }
  });
});
