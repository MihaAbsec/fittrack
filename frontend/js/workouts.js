const API = window.FITTRACK_API_BASE || '/backend/api';
let allExercises = [];   
let templates    = [];   
let selectedExercises = [];  


document.addEventListener('DOMContentLoaded', async () => {
    await loadExerciseLibrary();
    await loadTemplates();
    bindButtons();
});


async function loadExerciseLibrary() {
    try {
        const res  = await fetch(`${API}/exercises-library.php`);
        const data = await res.json();
        if (data.success) allExercises = data.data;
    } catch (e) { console.error(e); }
}

async function loadTemplates() {
    try {
        const res  = await fetch(`${API}/templates.php`);
        const data = await res.json();
        if (data.success) { templates = data.data; renderTemplates(); }
    } catch (e) { console.error(e); }
}


function renderTemplates() {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;

    if (templates.length === 0) {
        grid.innerHTML = `<div class="empty-state">
            <i class="fas fa-dumbbell"></i>
            <h3>Še nimate treninga</h3>
            <p>Ustvari prvi trening npr. Push, Pull ali Legs.</p>
        </div>`;
        return;
    }

    grid.innerHTML = templates.map(t => `
        <div class="template-card">
            <div class="template-card-header">
                <h3>${t.name}</h3>
                <button class="btn-icon btn-delete-template" data-id="${t.id}" title="Izbriši">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            ${t.description ? `<p class="template-desc">${t.description}</p>` : ''}
            <div class="template-tags">
                ${t.exercises.map(ex => `<span class="tag">${ex.name}</span>`).join('')}
            </div>
            <button class="btn-primary btn-start-session" data-id="${t.id}">
                <i class="fas fa-play"></i> Začni sejo
            </button>
        </div>
    `).join('');
}


function bindButtons() {
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-new-template'))     { openNewTemplateModal(); return; }
        if (e.target.closest('.btn-start-session'))    { openSessionModal(Number(e.target.closest('.btn-start-session').dataset.id)); return; }
        if (e.target.closest('.btn-delete-template'))  { await deleteTemplate(Number(e.target.closest('.btn-delete-template').dataset.id)); return; }
        if (e.target.classList.contains('modal-backdrop') || e.target.closest('.modal-close-btn')) { closeModal(); return; }
    });
}

function openNewTemplateModal() {
    selectedExercises = [];
    const muscleGroups = [...new Set(allExercises.map(e => e.muscle_group))];

    document.getElementById('modal-container').innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-box">
                <div class="modal-header">
                    <h2><i class="fas fa-plus"></i> Nov trening</h2>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Ime treninga *</label>
                        <input type="text" id="tpl-name" placeholder="npr. Push, Pull, Legs…">
                    </div>
                    <div class="form-group">
                        <label>Opis (opcijsko)</label>
                        <input type="text" id="tpl-desc" placeholder="npr. Zgornji del telesa">
                    </div>

                    <div class="form-group">
                        <label>Iskanje vaj</label>
                        <div class="picker-filters">
                            <select id="tpl-muscle-filter">
                                <option value="">Vse</option>
                                ${muscleGroups.map(g => `<option value="${g}">${g}</option>`).join('')}
                            </select>
                            <input type="text" id="tpl-search" placeholder="Iši…">
                        </div>
                    </div>
                    <div id="tpl-picker" class="exercise-picker"></div>
                    <div id="tpl-selected" class="selected-tags"></div>

                    <div class="error-message" id="tpl-error"></div>
                    <button class="btn-primary btn-full" id="btn-save-template">
                        <span class="btn-text"><i class="fas fa-save"></i> Shrani trening</span>
                        <span class="btn-loader" style="display:none"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </div>
        </div>`;

    renderPicker();
    document.getElementById('tpl-muscle-filter').addEventListener('change', renderPicker);
    document.getElementById('tpl-search').addEventListener('input', renderPicker);
    document.getElementById('tpl-picker').addEventListener('click', (e) => {
        if (e.target.closest('.btn-add-ex')) addToSelected(Number(e.target.closest('.btn-add-ex').dataset.id));
    });
    document.getElementById('btn-save-template').addEventListener('click', saveTemplate);
}

function renderPicker() {
    const muscle = document.getElementById('tpl-muscle-filter').value;
    const q      = document.getElementById('tpl-search').value.toLowerCase();
    const list   = allExercises.filter(ex =>
        (!muscle || ex.muscle_group === muscle) &&
        (!q      || ex.name.toLowerCase().includes(q))
    );
    document.getElementById('tpl-picker').innerHTML = list.map(ex => `
        <div class="picker-item ${selectedExercises.includes(ex.id) ? 'already-added' : ''}">
            <span class="picker-name">${ex.name}</span>
            <span class="picker-group">${ex.muscle_group}</span>
            ${selectedExercises.includes(ex.id)
                ? `<span class="picker-added">✓</span>`
                : `<button class="btn-icon btn-add-ex" data-id="${ex.id}"><i class="fas fa-plus"></i></button>`}
        </div>
    `).join('');
}

function addToSelected(exId) {
    if (selectedExercises.includes(exId)) return;
    selectedExercises.push(exId);
    renderPicker();
    renderSelectedTags();
}

function removeFromSelected(exId) {
    selectedExercises = selectedExercises.filter(id => id !== exId);
    renderPicker();
    renderSelectedTags();
}

function renderSelectedTags() {
    const el = document.getElementById('tpl-selected');
    if (!el) return;
    el.innerHTML = selectedExercises.length === 0
        ? '<p class="muted">Nobena vaja ni dodana.</p>'
        : `<label>Dodane vaje (${selectedExercises.length})</label>` +
          selectedExercises.map(id => {
              const ex = allExercises.find(e => e.id === id);
              return `<span class="selected-tag">${ex.name} <button class="btn-icon btn-remove-sel" onclick="removeFromSelected(${id})"><i class="fas fa-times"></i></button></span>`;
          }).join('');
}

async function saveTemplate() {
    const name = document.getElementById('tpl-name').value.trim();
    const errEl = document.getElementById('tpl-error');
    if (!name)                     { errEl.textContent = 'Vnesi ime treninga'; errEl.style.display='block'; return; }
    if (selectedExercises.length === 0) { errEl.textContent = 'Dodaj vsaj eno vajo'; errEl.style.display='block'; return; }

    const btn = document.getElementById('btn-save-template');
    btn.querySelector('.btn-text').style.display  = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline-block';
    btn.disabled = true;

    try {
        const res  = await fetch(`${API}/templates.php`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name, description: document.getElementById('tpl-desc').value.trim(), exercises: selectedExercises })
        });
        const data = await res.json();
        if (data.success) { closeModal(); await loadTemplates(); showToast('Trening ustvarjen! 🎉'); }
        else { errEl.textContent = data.error.message; errEl.style.display='block'; }
    } catch(e) { errEl.textContent = 'Napaka'; errEl.style.display='block'; }

    btn.disabled = false;
    btn.querySelector('.btn-text').style.display  = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
}

async function deleteTemplate(id) {
    if (!confirm('Izbriši trening?')) return;
    try {
        const res = await fetch(`${API}/templates.php?id=${id}`, { method:'DELETE' });
        const data = await res.json();
        if (data.success) { await loadTemplates(); showToast('Trening izbrisan.'); }
    } catch(e) { console.error(e); }
}


function openSessionModal(templateId) {
    const tpl   = templates.find(t => t.id === templateId);
    if (!tpl) return;
    const today = new Date().toISOString().split('T')[0];

    const exerciseBlocks = tpl.exercises.map(ex => `
        <div class="session-ex-block" data-exercise-id="${ex.exercise_id}">
            <div class="session-ex-header">
                <h4>${ex.name} <span class="tag">${ex.muscle_group}</span></h4>
                <button class="btn-secondary btn-small btn-add-row" data-exercise-id="${ex.exercise_id}">
                    <i class="fas fa-plus"></i> Vrstica
                </button>
            </div>
            <div class="rows-container" id="rows-${ex.exercise_id}">
                ${makeRow()}
            </div>
        </div>
    `).join('');

    document.getElementById('modal-container').innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-box">
                <div class="modal-header">
                    <h2><i class="fas fa-play"></i> ${tpl.name} – nova seja</h2>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Datum</label>
                            <input type="date" id="sess-date" value="${today}">
                        </div>
                        <div class="form-group">
                            <label>Trajanje (min)</label>
                            <input type="number" id="sess-duration" placeholder="60">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Opombe</label>
                        <input type="text" id="sess-notes" placeholder="Kako je šlo…">
                    </div>

                    <div id="session-exercises">${exerciseBlocks}</div>

                    <div class="error-message" id="sess-error"></div>
                    <button class="btn-primary btn-full" id="btn-save-session" data-template="${templateId}">
                        <span class="btn-text"><i class="fas fa-save"></i> Shrani sejo</span>
                        <span class="btn-loader" style="display:none"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </div>
        </div>`;

    document.getElementById('session-exercises').addEventListener('click', (e) => {
        if (e.target.closest('.btn-add-row')) {
            const exId = e.target.closest('.btn-add-row').dataset.exerciseId;
            document.getElementById(`rows-${exId}`).insertAdjacentHTML('beforeend', makeRow());
        }
        if (e.target.closest('.btn-remove-row')) {
            const rowEl = e.target.closest('.log-row');
            const parent = rowEl.parentElement;
            if (parent.querySelectorAll('.log-row').length > 1) rowEl.remove();
        }
    });

    document.getElementById('btn-save-session').addEventListener('click', saveSession);
}

function makeRow() {
    return `<div class="log-row">
        <input type="number" class="input-reps" placeholder="Ponov." min="1">
        <input type="number" class="input-weight" placeholder="Kg" step="0.5" min="0">
        <button class="btn-icon btn-remove-row"><i class="fas fa-minus"></i></button>
    </div>`;
}

async function saveSession() {
    const btn    = document.getElementById('btn-save-session');
    const errEl  = document.getElementById('sess-error');
    const tplId  = Number(btn.dataset.template);

    const logs = [];
    document.querySelectorAll('.session-ex-block').forEach(block => {
        const exId = Number(block.dataset.exerciseId);
        block.querySelectorAll('.log-row').forEach(row => {
            const reps   = row.querySelector('.input-reps').value;
            const weight = row.querySelector('.input-weight').value;
            if (reps && reps !== '0') {
                logs.push({ exercise_id: exId, reps: Number(reps), weight: weight !== '' ? Number(weight) : null });
            }
        });
    });

    if (logs.length === 0) { errEl.textContent = 'Vnesi vsaj eno ponovitev'; errEl.style.display='block'; return; }

    btn.querySelector('.btn-text').style.display  = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline-block';
    btn.disabled = true;

    try {
        const res  = await fetch(`${API}/sessions.php`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                template_id:      tplId,
                session_date:     document.getElementById('sess-date').value,
                duration_minutes: document.getElementById('sess-duration').value || null,
                notes:            document.getElementById('sess-notes').value,
                logs:             logs
            })
        });
        const data = await res.json();
        if (data.success) { closeModal(); showToast('Seja zabeleženа! 💪'); }
        else { errEl.textContent = data.error.message; errEl.style.display='block'; }
    } catch(e) { errEl.textContent = 'Napaka: ' + e.message; errEl.style.display='block'; }

    btn.disabled = false;
    btn.querySelector('.btn-text').style.display  = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
}

function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
    selectedExercises = [];
}

function showToast(msg) {
    let t = document.getElementById('toast-msg');
    if (!t) { t = document.createElement('div'); t.id = 'toast-msg'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
