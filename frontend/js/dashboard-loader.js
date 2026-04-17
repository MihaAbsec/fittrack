document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const res  = await fetch((window.FITTRACK_API_BASE || '/backend/api') + '/dashboard-stats.php');
        const data = await res.json();
        if (!data.success) return;
        const s = data.data;

        setStatCard(0, s.sessions_this_month ?? 0, 'Sej ta mesec');
        setStatCard(1, s.total_sessions ?? 0,      'Skupaj sej');
        setStatCard(2, s.calories_today ?? 0,      'Kalorije danes');
        setStatCard(3, s.current_weight ? s.current_weight + ' kg' : '—', 'Teža');

        renderRecentSessions(s.recent_sessions || []);

    } catch(e) { console.error(e); }
}

function setStatCard(index, value, label) {
    const cards = document.querySelectorAll('.stat-card-small');
    if (cards[index]) {
        cards[index].querySelector('h3').textContent = value;
        cards[index].querySelector('p').textContent  = label;
    }
}

function renderRecentSessions(sessions) {
    const container = document.getElementById('recent-sessions-list');
    if (!container) return;

    if (sessions.length === 0) {
        container.innerHTML = `<p class="muted" style="text-align:center; padding:2rem;">
            Nimate še zabeleženih sej. Začni vaditi!
        </p>`;
        return;
    }

    container.innerHTML = sessions.map(s => `
        <div class="recent-session-card">
            <div class="recent-session-header">
                <strong>${s.template_name}</strong>
                <span class="muted">${formatDate(s.session_date)}</span>
            </div>
            <div class="recent-session-exercises">
                ${s.exercise_names.map(n => `<span class="tag">${n}</span>`).join('')}
                ${s.duration_minutes ? `<span class="muted">${s.duration_minutes} min</span>` : ''}
            </div>
        </div>
    `).join('');
}

function formatDate(s) {
    const d = new Date(s + 'T00:00:00');
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Danes';
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    if (d.toDateString() === yesterday.toDateString()) return 'Včeraj';
    return d.toLocaleDateString('sl-SI', { day:'numeric', month:'long' });
}
