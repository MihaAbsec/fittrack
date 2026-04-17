const PROGRESS_API = window.FITTRACK_API_BASE || '/backend/api';
let exerciseList = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadExerciseList();
    document.getElementById('progress-exercise-select').addEventListener('change', () => {
        const id = document.getElementById('progress-exercise-select').value;
        if (id) loadProgress(Number(id));
        else    clearProgress();
    });
});

async function loadExerciseList() {
    try {
        const res  = await fetch(`${PROGRESS_API}/progress.php`);
        const data = await res.json();
        if (data.success) {
            exerciseList = data.data;
            renderExerciseSelect();
        }
    } catch(e) { console.error(e); }
}

function renderExerciseSelect() {
    const sel = document.getElementById('progress-exercise-select');
    if (exerciseList.length === 0) {
        sel.innerHTML = '<option value="">Nimate zabeleženih vaj…</option>';
        return;
    }
    const groups = {};
    exerciseList.forEach(ex => {
        if (!groups[ex.muscle_group]) groups[ex.muscle_group] = [];
        groups[ex.muscle_group].push(ex);
    });
    sel.innerHTML = '<option value="">Izberite vajo…</option>' +
        Object.entries(groups).map(([group, items]) =>
            `<optgroup label="${group}">` +
            items.map(ex => `<option value="${ex.id}">${ex.name}</option>`).join('') +
            '</optgroup>'
        ).join('');
}

async function loadProgress(exerciseId) {
    try {
        const res  = await fetch(`${PROGRESS_API}/progress.php?exercise_id=${exerciseId}`);
        const data = await res.json();
        if (data.success) renderProgress(data.data);
    } catch(e) { console.error(e); }
}

function renderProgress(records) {
    const container = document.getElementById('progress-content');

    if (records.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-chart-line"></i><h3>Ni podatkov</h3><p>Za to vajo še nimate zabeleženых sejev.</p></div>`;
        return;
    }

    const exerciseName = records[0].exercise_name;

    const maxWeight  = Math.max(...records.map(r => Number(r.max_weight) || 0));
    const maxReps    = Math.max(...records.map(r => Number(r.max_reps)   || 0));
    const sessions   = records.length;
    const first = Number(records[0].max_weight) || 0;
    const last  = Number(records[records.length-1].max_weight) || 0;
    const diff  = last - first;

    container.innerHTML = `
        <h3 style="color:#f8fafc; margin-bottom:1rem;">${exerciseName}</h3>
        <div class="stats-cards">
            <div class="stat-card-small">
                <h3>${maxWeight} kg</h3>
                <p>Osebni rekord</p>
            </div>
            <div class="stat-card-small">
                <h3>${maxReps}</h3>
                <p>Največ ponovitev</p>
            </div>
            <div class="stat-card-small">
                <h3>${sessions}</h3>
                <p>Sej</p>
            </div>
            <div class="stat-card-small">
                <h3 style="color:${diff >= 0 ? '#4CAF50' : '#ef4444'}">${diff >= 0 ? '+' : ''}${diff} kg</h3>
                <p>Napredek</p>
            </div>
        </div>

        <!-- SVG Chart -->
        <div class="chart-card" style="margin-top:1.5rem;">
            <div class="chart-header"><h3><i class="fas fa-chart-line"></i> Teža skozi čas</h3></div>
            <svg id="progress-svg" class="progress-chart" viewBox="0 0 600 220" preserveAspectRatio="xMidYMid meet" style="width:100%; max-height:260px; display:block;"></svg>
        </div>

        <!-- Table -->
        <div class="data-table" style="margin-top:1.5rem;">
            <div class="table-header" style="grid-template-columns: 1.2fr 1fr 1fr 1fr;">
                <span>Datum</span>
                <span>Maks. teža</span>
                <span>Maks. ponov.</span>
                <span>Skupaj ponov.</span>
            </div>
            ${records.map(r => `
                <div class="table-row" style="grid-template-columns: 1.2fr 1fr 1fr 1fr;">
                    <div>${formatDate(r.session_date)}</div>
                    <div><strong>${r.max_weight || '—'} kg</strong></div>
                    <div>${r.max_reps}</div>
                    <div>${r.total_reps}</div>
                </div>
            `).join('')}
        </div>`;

    drawSVGChart(records);
}

function drawSVGChart(records) {
    const svg    = document.getElementById('progress-svg');
    const W      = 600, H = 220;
    const padL   = 50, padR = 20, padT = 20, padB = 30;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const weights = records.map(r => Number(r.max_weight) || 0);
    const minW    = Math.max(0, Math.min(...weights) - 5);
    const maxW    = Math.max(...weights) + 5;
    const range   = maxW - minW || 1;

    const points = records.map((r, i) => {
        const x = padL + (i / (records.length - 1 || 1)) * innerW;
        const y = padT + innerH - ((Number(r.max_weight) || 0) - minW) / range * innerH;
        return { x, y, w: r.max_weight, d: r.session_date };
    });

    const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

    const areaD = `M ${points[0].x} ${padT + innerH} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length-1].x} ${padT + innerH} Z`;

    const yTicks = [minW, (minW + maxW) / 2, maxW].map((val, i) => {
        const y = padT + innerH - (i * innerH / 2);
        return `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="11">${val.toFixed(0)}</text>
                <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    }).join('');

    const xLabels = records.length > 1
        ? `<text x="${padL}" y="${H - 8}" fill="#64748b" font-size="10">${formatDate(records[0].session_date)}</text>
           <text x="${W - padR}" y="${H - 8}" text-anchor="end" fill="#64748b" font-size="10">${formatDate(records[records.length-1].session_date)}</text>`
        : '';

    const dots = points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#4CAF50" stroke="#0f172a" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="#cbd5e1" font-size="11" font-weight="bold">${p.w} kg</text>
    `).join('');

    svg.innerHTML = `
        <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4CAF50" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#4CAF50" stop-opacity="0"/>
            </linearGradient>
        </defs>
        ${yTicks}
        ${xLabels}
        <path d="${areaD}" fill="url(#areaGrad)"/>
        <polyline points="${polyline}" fill="none" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}`;
}

function clearProgress() {
    document.getElementById('progress-content').innerHTML =
        `<div class="empty-state"><i class="fas fa-chart-line"></i><h3>Izberite vajo</h3><p>Iz zgornjega menija izberite vajo za prikaz napredka.</p></div>`;
}

function formatDate(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('sl-SI', { day:'numeric', month:'long', year:'numeric' });
}
