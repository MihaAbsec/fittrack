document.addEventListener('DOMContentLoaded', function () {
    var sidebar   = document.querySelector('.sidebar');
    var overlay   = document.getElementById('sidebarOverlay');
    var btn       = document.getElementById('sidebarToggle');
    var icon      = btn ? btn.querySelector('i') : null;

    if (!sidebar || !btn) return;

    function open() {
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (icon)    icon.className = 'fas fa-times';
        document.body.style.overflow = 'hidden';
    }
    function close() {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (icon)    icon.className = 'fas fa-bars';
        document.body.style.overflow = '';
    }

    btn.addEventListener('click', function () {
        sidebar.classList.contains('active') ? close() : open();
    });

    if (overlay) overlay.addEventListener('click', close);

    document.querySelectorAll('.sidebar-nav a').forEach(function (a) {
        a.addEventListener('click', function () {
            if (window.innerWidth <= 1024) close();
        });
    });
});
