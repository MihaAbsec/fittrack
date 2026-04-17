const PROFILE_API = window.FITTRACK_API_BASE || '/backend/api';

document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
    bindInputs();
    document.getElementById('btn-save-profile').addEventListener('click', saveProfile);
});

async function loadProfile() {
    try {
        const res  = await fetch(`${PROFILE_API}/profile.php`);
        const data = await res.json();
        if (!data.success) return;

        const { user, profile, training_days, total_sessions, active_months } = data.data;

        if (user.full_name)  document.getElementById('fullName').value  = user.full_name;
        if (user.email)      document.getElementById('email').value     = user.email;
        if (user.username)   document.getElementById('username').value  = user.username;

        if (profile.birth_date)        document.getElementById('birthDate').value      = profile.birth_date;
        if (profile.gender)            document.getElementById('gender').value         = profile.gender;
        if (profile.height_cm)         document.getElementById('currentHeight').value  = profile.height_cm;
        if (profile.current_weight_kg) document.getElementById('currentWeight').value  = profile.current_weight_kg;
        if (profile.goal_weight_kg)    document.getElementById('goalWeight').value     = profile.goal_weight_kg;

        updateBMI();

        updateGoalBar();

        document.getElementById('stat-total-sessions').textContent = total_sessions;
        document.getElementById('stat-training-days').textContent  = training_days;
        document.getElementById('stat-active-months').textContent  = active_months;

    } catch(e) { console.error(e); }
}

function bindInputs() {
    document.getElementById('currentWeight').addEventListener('input', () => { updateBMI(); updateGoalBar(); });
    document.getElementById('currentHeight').addEventListener('input', updateBMI);
    document.getElementById('goalWeight').addEventListener('input', updateGoalBar);
}

function updateBMI() {
    const w = parseFloat(document.getElementById('currentWeight').value);
    const h = parseFloat(document.getElementById('currentHeight').value);
    const bmiEl    = document.getElementById('bmi-value');
    const catEl    = document.getElementById('bmi-category');

    if (!w || !h || h === 0) { bmiEl.textContent = '—'; catEl.textContent = ''; return; }

    const bmi = w / ((h / 100) * (h / 100));
    bmiEl.textContent = bmi.toFixed(1);

    let cat, color;
    if      (bmi < 18.5) { cat = 'Pomanjkanje teže';  color = '#2196F3'; }
    else if (bmi < 25)   { cat = 'Normalna teža';     color = '#4CAF50'; }
    else if (bmi < 30)   { cat = 'Prekomerna teža';   color = '#FF9800'; }
    else                  { cat = 'Debelost';          color = '#ef4444'; }

    catEl.textContent = cat;
    bmiEl.style.color = color;
}

function updateGoalBar() {
    const current = parseFloat(document.getElementById('currentWeight').value) || 0;
    const goal    = parseFloat(document.getElementById('goalWeight').value)    || 0;
    const barEl   = document.getElementById('goal-progress-fill');
    const pctEl   = document.getElementById('goal-progress-pct');
    const goalDisp = document.getElementById('goal-weight-display');

    if (goal > 0) {
        goalDisp.textContent = goal + ' kg';
        const pct = Math.min(100, Math.round((Math.min(current, goal) / Math.max(current, goal)) * 100));
        barEl.style.width  = pct + '%';
        pctEl.textContent  = pct + '%';
    } else {
        goalDisp.textContent = '—';
        barEl.style.width    = '0%';
        pctEl.textContent    = '—';
    }
}

async function saveProfile() {
    const btn  = document.getElementById('btn-save-profile');
    const errEl = document.getElementById('profile-error');

    btn.querySelector('.btn-text').style.display  = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline-block';
    btn.disabled = true;

    try {
        const res = await fetch(`${PROFILE_API}/profile.php`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                full_name:      document.getElementById('fullName').value.trim(),
                birth_date:     document.getElementById('birthDate').value,
                gender:         document.getElementById('gender').value,
                height_cm:      document.getElementById('currentHeight').value,
                current_weight: document.getElementById('currentWeight').value,
                goal_weight:    document.getElementById('goalWeight').value
            })
        });
        const data = await res.json();
        if (data.success) { showToast('Profil shranjen! ✓'); errEl.style.display = 'none'; }
        else { errEl.textContent = data.error.message; errEl.style.display = 'block'; }
    } catch(e) { errEl.textContent = 'Napaka: ' + e.message; errEl.style.display = 'block'; }

    btn.disabled = false;
    btn.querySelector('.btn-text').style.display  = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
}

function showToast(msg) {
    let t = document.getElementById('toast-msg');
    if (!t) { t = document.createElement('div'); t.id='toast-msg'; t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

document.querySelector('.btn-danger')?.addEventListener('click', () => {
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-backdrop" id="delete-account-modal">
            <div class="modal-box" style="max-width:380px">
                <div class="modal-header">
                    <h2><i class="fas fa-exclamation-triangle" style="color:#f87171"></i> Izbriši račun</h2>
                    <button class="modal-close-btn" id="delete-modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:1rem;">
                        To dejanje je <strong style="color:#f87171">nepovratno</strong>. Vsi tvoji podatki bodo trajno izbrisani.
                    </p>
                    <div class="form-group">
                        <label>Vnesi geslo za potrditev</label>
                        <input type="password" id="delete-confirm-password" placeholder="Tvoje geslo">
                    </div>
                    <div class="error-message" id="delete-error"></div>
                    <button class="btn-danger" id="btn-confirm-delete" style="width:100%; justify-content:center; margin-top:0.5rem">
                        <i class="fas fa-trash"></i> Potrdi brisanje
                    </button>
                </div>
            </div>
        </div>
    `);

    document.getElementById('delete-modal-close').addEventListener('click', () => {
        document.getElementById('delete-account-modal')?.remove();
    });
    document.getElementById('delete-account-modal').addEventListener('click', (e) => {
        if (e.target.id === 'delete-account-modal') document.getElementById('delete-account-modal')?.remove();
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
        const password = document.getElementById('delete-confirm-password').value;
        const errEl    = document.getElementById('delete-error');
        const btn      = document.getElementById('btn-confirm-delete');

        if (!password) { errEl.textContent = 'Vnesi geslo'; errEl.style.display = 'block'; return; }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Brišem...';

        try {
            const res  = await fetch((window.FITTRACK_API_BASE || '/backend/api') + '/profile.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (data.success) {
                document.getElementById('delete-account-modal')?.remove();
                showToast('Račun izbrisan. Na svidenje! 👋');
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            } else {
                errEl.textContent = data.error.message;
                errEl.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash"></i> Potrdi brisanje';
            }
        } catch(e) {
            errEl.textContent = 'Napaka: ' + e.message;
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-trash"></i> Potrdi brisanje';
        }
    });
});
