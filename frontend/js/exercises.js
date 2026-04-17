document.addEventListener('DOMContentLoaded', async () => {
    await loadAndRender();
    bindFilters();
});

let allExercises = [];

async function loadAndRender() {
    try {
        const res  = await fetch((window.FITTRACK_API_BASE || '/backend/api') + '/exercises-library.php');
        const data = await res.json();
        if (data.success) { allExercises = data.data; renderExercises(allExercises); }
    } catch(e) { console.error(e); }
}

function bindFilters() {
    const muscleSel = document.getElementById('muscleGroup');
    const searchIn  = document.getElementById('exerciseSearch');
    if (muscleSel) muscleSel.addEventListener('change', applyFilter);
    if (searchIn)  searchIn.addEventListener('input', applyFilter);
}

function applyFilter() {
    const muscle = document.getElementById('muscleGroup')?.value || '';
    const q      = (document.getElementById('exerciseSearch')?.value || '').toLowerCase();
    const filtered = allExercises.filter(ex =>
        (!muscle || ex.muscle_group === muscle) &&
        (!q      || ex.name.toLowerCase().includes(q) || (ex.description||'').toLowerCase().includes(q))
    );
    renderExercises(filtered);
}

function renderExercises(list) {
    const grid = document.getElementById('exercisesGrid');
    if (!grid) return;

    if (list.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-dumbbell"></i><h3>Ni rezultatov</h3></div>`;
        return;
    }

    const diffColors = { začetnik:'#4CAF50', srednje:'#FF9800', napredno:'#ef4444' };

    grid.innerHTML = list.map(ex => `
        <div class="exercise-card">
            <div class="exercise-card-header">
                <h3>${ex.name}</h3>
                <span class="tag" style="background:rgba(76,175,80,0.12);color:#86efac;">${ex.muscle_group}</span>
            </div>
            <p class="exercise-card-desc">${ex.description || ''}</p>
            <div class="exercise-card-meta">
                <span class="tag" style="background:rgba(33,150,243,0.12);color:#7dd3fc;">${ex.equipment || '—'}</span>
                <span class="difficulty-badge" style="color:${diffColors[ex.difficulty]||'#94a3b8'};">● ${ex.difficulty}</span>
            </div>
        </div>
    `).join('');
}
