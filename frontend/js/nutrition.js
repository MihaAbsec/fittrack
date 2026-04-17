const API = '/nutrition';    
const NUTRITION_API = window.FITTRACK_API_BASE || '/backend/api';

let currentDate = new Date().toISOString().split('T')[0];  

document.addEventListener('DOMContentLoaded', () => {
    setDatePicker();
    loadNutrition();
    bindButtons();
});

function setDatePicker() {
    const input = document.getElementById('nutrition-date');
    if (input) { input.value = currentDate; input.addEventListener('change', () => { currentDate = input.value; loadNutrition(); }); }
    const todayBtn = document.getElementById('btn-today');
    if (todayBtn) todayBtn.addEventListener('click', () => {
        currentDate = new Date().toISOString().split('T')[0];
        if (input) input.value = currentDate;
        loadNutrition();
    });
}

async function loadNutrition() {
    try {
        const res  = await fetch(`${NUTRITION_API}/get-nutrition.php?date=${currentDate}`);
        const data = await res.json();
        if (data.success) renderNutrition(data.data);
    } catch(e) { console.error(e); }
}

function renderNutrition(data) {
    const entries = data.entries || [];
    const totals  = data.totals  || { calories:0, protein:0, carbs:0, fats:0 };

    document.getElementById('total-calories').textContent = totals.calories || 0;
    document.getElementById('total-protein').textContent  = (totals.protein  || 0).toFixed(1);
    document.getElementById('total-carbs').textContent    = (totals.carbs    || 0).toFixed(1);
    document.getElementById('total-fats').textContent     = (totals.fats     || 0).toFixed(1);

    const mealOrder = ['zajtrk','kosilo','večerja','prigrizek'];
    const mealIcons = { zajtrk:'fa-sun', kosilo:'fa-cloud-sun', večerja:'fa-moon', prigrizek:'fa-seedling' };

    const container = document.getElementById('meals-list');
    container.innerHTML = '';

    mealOrder.forEach(type => {
        const items = entries.filter(e => e.meal_type === type);
        if (items.length === 0) return;
        const mealCal = items.reduce((s, e) => s + (Number(e.calories) || 0), 0);

        container.innerHTML += `
            <div class="meal-section">
                <div class="meal-header">
                    <h3><i class="fas ${mealIcons[type]}"></i> ${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                    <span class="meal-kcal">${mealCal} kcal</span>
                </div>
                <div class="meal-items">
                    ${items.map(item => `
                        <div class="meal-item">
                            <div class="meal-item-info">
                                <strong>${item.food_name}</strong>
                                <div class="meal-item-macros">
                                    <span>${item.calories || 0} kcal</span>
                                    <span>B: ${item.protein || 0}g</span>
                                    <span>O: ${item.carbs || 0}g</span>
                                    <span>M: ${item.fats || 0}g</span>
                                </div>
                            </div>
                            <button class="btn-icon btn-delete-meal" data-id="${item.id}" title="Izbriši">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    });

    if (entries.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <i class="fas fa-apple-alt"></i>
            <h3>Nobega vnosa danes</h3>
            <p>Dodaj prvi obrok!</p>
        </div>`;
    }
}

function bindButtons() {
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-add-meal'))        { openMealModal(); return; }
        if (e.target.closest('.btn-delete-meal'))     { await deleteMeal(e.target.closest('.btn-delete-meal').dataset.id); return; }
        if (e.target.classList.contains('modal-backdrop') || e.target.closest('.modal-close-btn')) { closeModal(); return; }
    });
}

function openMealModal() {
    document.getElementById('modal-container').innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-box">
                <div class="modal-header">
                    <h2><i class="fas fa-plus"></i> Dodaj obrok</h2>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Vrsta obroka *</label>
                            <select id="meal-type">
                                <option value="zajtrk">Zajtrk</option>
                                <option value="kosilo">Kosilo</option>
                                <option value="večerja">Večerja</option>
                                <option value="prigrizek">Prigrizek</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Datum</label>
                            <input type="date" id="meal-date" value="${currentDate}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Ime jedi *</label>
                        <input type="text" id="meal-name" placeholder="npr. Piščančji file s rižem">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Kalorije (kcal)</label>
                            <input type="number" id="meal-calories" placeholder="350" min="0">
                        </div>
                        <div class="form-group">
                            <label>Beljakovine (g)</label>
                            <input type="number" id="meal-protein" placeholder="30" step="0.1" min="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Ogljikovi hidrati (g)</label>
                            <input type="number" id="meal-carbs" placeholder="40" step="0.1" min="0">
                        </div>
                        <div class="form-group">
                            <label>Maščobe (g)</label>
                            <input type="number" id="meal-fats" placeholder="15" step="0.1" min="0">
                        </div>
                    </div>
                    <div class="error-message" id="meal-error"></div>
                    <button class="btn-primary btn-full" id="btn-save-meal">
                        <span class="btn-text"><i class="fas fa-save"></i> Shrani obrok</span>
                        <span class="btn-loader" style="display:none"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </div>
        </div>`;

    document.getElementById('btn-save-meal').addEventListener('click', saveMeal);
}

async function saveMeal() {
    const name = document.getElementById('meal-name').value.trim();
    const errEl = document.getElementById('meal-error');
    if (!name) { errEl.textContent = 'Vnesi ime jedi'; errEl.style.display='block'; return; }

    const btn = document.getElementById('btn-save-meal');
    btn.querySelector('.btn-text').style.display  = 'none';
    btn.querySelector('.btn-loader').style.display = 'inline-block';
    btn.disabled = true;

    try {
        const res = await fetch(`${NUTRITION_API}/add-nutrition.php`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                meal_type:   document.getElementById('meal-type').value,
                entry_date:  document.getElementById('meal-date').value,
                food_name:   name,
                calories:    document.getElementById('meal-calories').value || 0,
                protein:     document.getElementById('meal-protein').value  || 0,
                carbs:       document.getElementById('meal-carbs').value    || 0,
                fats:        document.getElementById('meal-fats').value     || 0
            })
        });
        const data = await res.json();
        if (data.success) { closeModal(); loadNutrition(); showToast('Obrok dodan! 🍽️'); }
        else { errEl.textContent = data.error.message; errEl.style.display='block'; }
    } catch(e) { errEl.textContent = 'Napaka'; errEl.style.display='block'; }

    btn.disabled = false;
    btn.querySelector('.btn-text').style.display  = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
}

async function deleteMeal(id) {
    if (!confirm('Izbriši vnos?')) return;
    try {
        const res = await fetch(`${NUTRITION_API}/delete-nutrition.php`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ id: Number(id) })
        });
        const data = await res.json();
        if (data.success) { loadNutrition(); showToast('Vnos izbrisan.'); }
    } catch(e) { console.error(e); }
}

function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

function showToast(msg) {
    let t = document.getElementById('toast-msg');
    if (!t) { t = document.createElement('div'); t.id='toast-msg'; t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
