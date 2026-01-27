// Configuration
const PASSWORD = 'BVA1DockInbound2026@';
const REMEMBER_KEY = 'bva1_dock_authenticated';
let vridData = [];
let filteredData = [];

// ===== AUTHENTIFICATION =====
function handleLogin(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('password');
    const password = passwordInput.value;
    const errorMessage = document.getElementById('errorMessage');

    if (password === PASSWORD) {
        // Succès
        localStorage.setItem(REMEMBER_KEY, 'true');
        localStorage.setItem(REMEMBER_KEY + '_time', new Date().getTime());
        showApp();
    } else {
        // Erreur
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').classList.add('show');
    loadData();
}

function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_KEY + '_time');
        vridData = [];
        filteredData = [];
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('appPage').classList.remove('show');
        document.getElementById('password').value = '';
    }
}

// ===== DONNÉES =====
function loadData() {
    // Charger depuis localStorage
    const saved = localStorage.getItem('vridData');
    if (saved) {
        vridData = JSON.parse(saved);
    } else {
        // Données de test
        vridData = [
            { vrid: 'AFT001', statut: 'IN PROGRESS', pallets: 5, units: 150, location: 'QUAI_1', remorques: 'REM001' },
            { vrid: 'AFT002', statut: 'VRAC', pallets: 3, units: 120, location: 'ZONE_VRAC', remorques: 'REM002' },
            { vrid: 'AFT003', statut: 'PALETTIZED', pallets: 2, units: 80, location: 'DOCK_A', remorques: 'REM003' },
            { vrid: 'AFT004', statut: 'DONE', pallets: 4, units: 200, location: 'STOCK_A', remorques: 'REM004' }
        ];
    }
    
    filteredData = [...vridData];
    updateDisplay();
}

function updateDisplay() {
    renderTable();
    updateStats();
}

function renderTable() {
    const tbody = document.getElementById('dataTable');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Aucune donnée à afficher</td></tr>';
        return;
    }

    tbody.innerHTML = filteredData.map((vrid, index) => `
        <tr>
            <td>${vrid.vrid}</td>
            <td>
                <span class="status ${vrid.statut.toLowerCase().replace(' ', '-')}">
                    ${vrid.statut}
                </span>
            </td>
            <td>${vrid.pallets}</td>
            <td>${vrid.units}</td>
            <td>${vrid.location}</td>
            <td>${vrid.remorques}</td>
            <td>
                <button class="edit-btn" onclick="editRow(${index})">✏️ Edit</button>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    const total = vridData.length;
    const inProgress = vridData.filter(v => v.statut === 'IN PROGRESS').length;
    const done = vridData.filter(v => v.statut === 'DONE').length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('doneCount').textContent = done;
    document.getElementById('completionRate').textContent = rate + '%';
}

// ===== IMPORT / EXPORT CSV =====
function importCSV() {
    document.getElementById('csvFile').click();
}

document.getElementById('csvFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const csv = event.target.result;
            const lines = csv.split('\n');
            
            if (lines.length < 2) {
                alert('Fichier CSV invalide');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const newData = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });

                if (row.vrid) {
                    newData.push({
                        vrid: row.vrid,
                        statut: row.statut || 'IN PROGRESS',
                        pallets: parseInt(row.pallets) || 0,
                        units: parseInt(row.units) || 0,
                        location: row.location || 'QUEUE',
                        remorques: row.remorques || ''
                    });
                }
            }

            if (newData.length > 0) {
                vridData = [...vridData, ...newData];
                localStorage.setItem('vridData', JSON.stringify(vridData));
                filteredData = [...vridData];
                updateDisplay();
                alert(`✅ ${newData.length} lignes importées avec succès !`);
            } else {
                alert('❌ Aucune donnée valide trouvée');
            }
        } catch (error) {
            alert('❌ Erreur lors de l\'import : ' + error.message);
        }
    };
    
    reader.readAsText(file);
    e.target.value = '';
});

function exportCSV() {
    if (vridData.length === 0) {
        alert('Aucune donnée à exporter');
        return;
    }

    const headers = ['VRID', 'Statut', 'Pallets', 'Units', 'Location', 'Remorques'];
    const rows = vridData.map(v => [
        v.vrid,
        v.statut,
        v.pallets,
        v.units,
        v.location,
        v.remorques
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flux_dock_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ===== FILTRAGE =====
function filterByStatus() {
    const status = document.getElementById('statusFilter').value;
    
    if (status) {
        filteredData = vridData.filter(v => v.statut === status);
    } else {
        filteredData = [...vridData];
    }
    
    renderTable();
}

// ===== ÉDITION =====
function editRow(index) {
    const vrid = filteredData[index];
    const newStatus = prompt('Nouveau statut (IN PROGRESS, VRAC, PALETTIZED, DONE):', vrid.statut);
    
    if (newStatus && ['IN PROGRESS', 'VRAC', 'PALETTIZED', 'DONE'].includes(newStatus)) {
        const mainIndex = vridData.findIndex(v => v.vrid === vrid.vrid);
        if (mainIndex !== -1) {
            vridData[mainIndex].statut = newStatus;
            localStorage.setItem('vridData', JSON.stringify(vridData));
            filterByStatus();
            updateStats();
        }
    }
}

// ===== INITIALISATION =====
window.addEventListener('load', function() {
    // Vérifier l'authentification
    if (localStorage.getItem(REMEMBER_KEY) === 'true') {
        const savedTime = parseInt(localStorage.getItem(REMEMBER_KEY + '_time'));
        const now = new Date().getTime();
        const dayInMs = 24 * 60 * 60 * 1000;

        if (now - savedTime < dayInMs) {
            showApp();
        } else {
            localStorage.removeItem(REMEMBER_KEY);
            localStorage.removeItem(REMEMBER_KEY + '_time');
        }
    }
});
