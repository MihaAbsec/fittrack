(function() {
    var path = window.location.pathname;
    var frontendIndex = path.indexOf('/frontend/');
    var apiBase;
    if (frontendIndex !== -1) {
        var projectRoot = path.substring(0, frontendIndex);
        apiBase = projectRoot + '/backend/api';
    } else {
        apiBase = '/backend/api';
    }
    window.FITTRACK_API_BASE = apiBase;
    console.log('[FitTrack] API Base:', apiBase);
})();
