<template>
  <div class="dashboard-container">
    <!-- Résumé des totaux -->
    <div class="summary-section">
      <h2>📊 Résumé Opérationnel</h2>
      <div class="summary-cards">
        <div class="summary-card in-progress">
          <div class="card-icon">🔄</div>
          <div class="card-content">
            <h3>{{ statusSummary.inProgress }}</h3>
            <p>IN PROGRESS</p>
          </div>
        </div>
        <div class="summary-card vrac">
          <div class="card-icon">📦</div>
          <div class="card-content">
            <h3>{{ statusSummary.vrac }}</h3>
            <p>VRAC</p>
          </div>
        </div>
        <div class="summary-card palettized">
          <div class="card-icon">🏗️</div>
          <div class="card-content">
            <h3>{{ statusSummary.palettized }}</h3>
            <p>PALETTIZED</p>
          </div>
        </div>
        <div class="summary-card done">
          <div class="card-icon">✅</div>
          <div class="card-content">
            <h3>{{ statusSummary.done }}</h3>
            <p>DONE</p>
          </div>
        </div>
      </div>
    </div>

    <!-- VRID Prioritaires -->
    <div class="priority-section">
      <h2>🚨 VRID Prioritaires</h2>
      <div class="priority-list">
        <div 
          v-for="vrid in priorityVRIDs" 
          :key="vrid.id"
          :class="['priority-item', getPriorityClass(vrid.priority)]"
        >
          <div class="priority-indicator">
            {{ getPriorityIcon(vrid.priority) }}
          </div>
          <div class="vrid-info">
            <strong>{{ vrid.vrid }}</strong>
            <span class="vrid-details">{{ vrid.location }} - {{ vrid.statut }}</span>
          </div>
          <div class="vrid-time">
            <span>{{ formatTime(vrid.waitTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Compteurs généraux -->
    <div class="counters-section">
      <h2>📈 Compteurs Généraux</h2>
      <div class="counters-grid">
        <div class="counter-card pallets">
          <div class="counter-icon">🏗️</div>
          <div class="counter-content">
            <h3>{{ totalCounters.pallets }}</h3>
            <p>PALLETS</p>
            <span class="counter-trend">+{{ dailyTrend.pallets }} aujourd'hui</span>
          </div>
        </div>
        <div class="counter-card bt">
          <div class="counter-icon">📋</div>
          <div class="counter-content">
            <h3>{{ totalCounters.bt }}</h3>
            <p>BT</p>
            <span class="counter-trend">+{{ dailyTrend.bt }} aujourd'hui</span>
          </div>
        </div>
        <div class="counter-card units">
          <div class="counter-icon">📦</div>
          <div class="counter-content">
            <h3>{{ totalCounters.units.toLocaleString() }}</h3>
            <p>UNITS</p>
            <span class="counter-trend">+{{ dailyTrend.units.toLocaleString() }} aujourd'hui</span>
          </div>
        </div>
        <div class="counter-card vrids">
          <div class="counter-icon">🚛</div>
          <div class="counter-content">
            <h3>{{ totalCounters.vrids }}</h3>
            <p>Nb VRID</p>
            <span class="counter-trend">+{{ dailyTrend.vrids }} aujourd'hui</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphique de performance (simulation) -->
    <div class="performance-section">
      <h2>📊 Performance Aujourd'hui</h2>
      <div class="performance-chart">
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div class="bar" style="height: 60%">
              <span>06h</span>
            </div>
            <div class="bar" style="height: 80%">
              <span>08h</span>
            </div>
            <div class="bar" style="height: 100%">
              <span>10h</span>
            </div>
            <div class="bar" style="height: 75%">
              <span>12h</span>
            </div>
            <div class="bar" style="height: 90%">
              <span>14h</span>
            </div>
            <div class="bar" style="height: 65%">
              <span>16h</span>
            </div>
          </div>
          <p>Traitement des VRID par tranche horaire</p>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="actions-section">
      <h2>⚡ Actions Rapides</h2>
      <div class="action-buttons">
        <button class="action-btn import-aft" @click="importAFT">
          📥 Import CSV AFT
        </button>
        <button class="action-btn import-fmc" @click="importFMC">
          📄 Import CSV FMC
        </button>
        <button class="action-btn sync" @click="syncData">
          🔄 Synchroniser
        </button>
        <button class="action-btn update" @click="updateData">
          🔃 Mettre à jour
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      statusSummary: {
        inProgress: 2,
        vrac: 1,
        palettized: 1,
        done: 1
      },
      priorityVRIDs: [
        {
          id: 1,
          vrid: 'VR240001',
          location: 'DOCK-A1',
          statut: 'IN PROGRESS',
          priority: 'high',
          waitTime: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2h d'attente
        },
        {
          id: 2,
          vrid: 'VR240005',
          location: 'DOCK-A2',
          statut: 'IN PROGRESS',
          priority: 'medium',
          waitTime: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1h d'attente
        },
        {
          id: 3,
          vrid: 'VR240002',
          location: 'DOCK-B2',
          statut: 'VRAC',
          priority: 'low',
          waitTime: new Date(Date.now() - 30 * 60 * 1000) // 30min d'attente
        }
      ],
      totalCounters: {
        pallets: 86,
        bt: 43,
        units: 5150,
        vrids: 5
      },
      dailyTrend: {
        pallets: 12,
        bt: 8,
        units: 850,
        vrids: 2
      }
    }
  },
  methods: {
    getPriorityClass(priority) {
      return `priority-${priority}`;
    },
    getPriorityIcon(priority) {
      switch(priority) {
        case 'high': return '🔴';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '⚪';
      }
    },
    formatTime(date) {
      const now = new Date();
      const diff = now - date;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    },
    importAFT() {
      console.log('Import AFT déclenché');
      this.$emit('switchTab', 'aft');
    },
    importFMC() {
      console.log('Import FMC déclenché');
      this.$emit('switchTab', 'fmc');
    },
    syncData() {
      console.log('Synchronisation des données...');
      // Animation de chargement
      this.showLoading('Synchronisation en cours...');
    },
    updateData() {
      console.log('Mise à jour des données...');
      this.showLoading('Mise à jour en cours...');
    },
    showLoading(message) {
      // Simulation d'une opération asynchrone
      const notification = document.createElement('div');
      notification.className = 'loading-notification';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.dashboard-container h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

/* Section résumé */
.summary-section {
  margin-bottom: 30px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-card.in-progress { border-left: 5px solid #3498db; }
.summary-card.vrac { border-left: 5px solid #f39c12; }
.summary-card.palettized { border-left: 5px solid #9b59b6; }
.summary-card.done { border-left: 5px solid #27ae60; }

.card-icon {
  font-size: 2.5rem;
  margin-right: 20px;
}

.card-content h3 {
  font-size: 2rem;
  margin: 0;
  color: #2c3e50;
}

.card-content p {
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-weight: bold;
}

/* Section priorités */
.priority-section {
  margin-bottom: 30px;
}

.priority-list {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.priority-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s ease;
}

.priority-item:hover {
  background-color: #f8f9fa;
}

.priority-item:last-child {
  border-bottom: none;
}

.priority-high { border-left: 4px solid #e74c3c; }
.priority-medium { border-left: 4px solid #f39c12; }
.priority-low { border-left: 4px solid #27ae60; }

.priority-indicator {
  font-size: 1.5rem;
  margin-right: 15px;
}

.vrid-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.vrid-info strong {
  color: #2c3e50;
  font-size: 1.1rem;
}

.vrid-details {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.vrid-time {
  color: #e74c3c;
  font-weight: bold;
}

/* Section compteurs */
.counters-section {
  margin-bottom: 30px;
}

.counters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.counter-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.counter-card:hover {
  transform: translateY(-2px);
}

.counter-card.pallets { border-top: 4px solid #9b59b6; }
.counter-card.bt { border-top: 4px solid #3498db; }
.counter-card.units { border-top: 4px solid #f39c12; }
.counter-card.vrids { border-top: 4px solid #27ae60; }

.counter-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.counter-content h3 {
  font-size: 1.8rem;
  margin: 0;
  color: #2c3e50;
}

.counter-content p {
  margin: 5px 0;
  color: #7f8c8d;
  font-weight: bold;
}

.counter-trend {
  font-size: 0.8rem;
  color: #27ae60;
  font-weight: bold;
}

/* Section performance */
.performance-section {
  margin-bottom: 30px;
}

.performance-chart {
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.chart-placeholder {
  text-align: center;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: end;
  height: 200px;
  margin-bottom: 20px;
}

.bar {
  background: linear-gradient(to top, #3498db, #5dade2);
  width: 40px;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: end;
  justify-content: center;
  color: white;
  font-weight: bold;
  transition: all 0.3s ease;
}

.bar:hover {
  background: linear-gradient(to top, #2980b9, #3498db);
}

.bar span {
  margin-bottom: 5px;
  font-size: 0.8rem;
}

/* Section actions */
.actions-section {
  margin-bottom: 30px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-btn {
  background: white;
  border: 2px solid #3498db;
  border-radius: 8px;
  padding: 15px 20px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-btn:hover {
  background: #3498db;
  color: white;
  transform: translateY(-2px);
}

.action-btn.import-aft:hover { background: #e74c3c; border-color: #e74c3c; }
.action-btn.import-fmc:hover { background: #f39c12; border-color: #f39c12; }
.action-btn.sync:hover { background: #9b59b6; border-color: #9b59b6; }
.action-btn.update:hover { background: #27ae60; border-color: #27ae60; }

/* Notification de chargement */
:global(.loading-notification) {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #3498db;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }
  
  .summary-cards,
  .counters-grid,
  .action-buttons {
    grid-template-columns: 1fr;
  }
  
  .priority-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>