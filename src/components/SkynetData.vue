<template>
  <div class="skynet-container">
    <div class="skynet-header">
      <h2>🌐 Skynet - Données en Direct</h2>
      <div class="connection-status">
        <span :class="['status-indicator', connectionStatus]"></span>
        <span class="status-text">
          {{ connectionStatus === 'connected' ? 'Connecté' : 
             connectionStatus === 'connecting' ? 'Connexion...' : 'Déconnecté' }}
        </span>
        <button class="btn btn-small" @click="toggleConnection">
          {{ connectionStatus === 'connected' ? '🔌 Déconnecter' : '🔌 Connecter' }}
        </button>
      </div>
    </div>

    <!-- Panneau de contrôle -->
    <div class="control-panel">
      <div class="control-group">
        <label>Fréquence de mise à jour:</label>
        <select v-model="refreshInterval" @change="updateRefreshRate">
          <option value="1000">1 seconde</option>
          <option value="5000">5 secondes</option>
          <option value="10000">10 secondes</option>
          <option value="30000">30 secondes</option>
        </select>
      </div>
      <div class="control-group">
        <label>Filtres actifs:</label>
        <div class="filter-tags">
          <span v-for="filter in activeFilters" :key="filter" class="filter-tag">
            {{ filter }}
            <button @click="removeFilter(filter)">×</button>
          </span>
        </div>
      </div>
      <div class="control-group">
        <button class="btn btn-primary" @click="showFilterModal = true">
          🔍 Ajouter Filtre
        </button>
        <button class="btn btn-warning" @click="pauseUpdates">
          {{ isPaused ? '▶️ Reprendre' : '⏸️ Pause' }}
        </button>
        <button class="btn btn-info" @click="exportSnapshot">
          📷 Snapshot
        </button>
      </div>
    </div>

    <!-- Métriques en temps réel -->
    <div class="metrics-section">
      <div class="metrics-grid">
        <div class="metric-card active-vrids">
          <div class="metric-header">
            <span class="metric-icon">🚛</span>
            <h4>VRID Actifs</h4>
          </div>
          <div class="metric-value">{{ liveMetrics.activeVRIDs }}</div>
          <div class="metric-change positive">↗️ +{{ liveMetrics.vridChange }}</div>
        </div>
        <div class="metric-card throughput">
          <div class="metric-header">
            <span class="metric-icon">⚡</span>
            <h4>Débit/h</h4>
          </div>
          <div class="metric-value">{{ liveMetrics.throughputPerHour }}</div>
          <div class="metric-change positive">↗️ {{ liveMetrics.throughputChange }}%</div>
        </div>
        <div class="metric-card avg-time">
          <div class="metric-header">
            <span class="metric-icon">⏰</span>
            <h4>Temps Moyen</h4>
          </div>
          <div class="metric-value">{{ liveMetrics.avgProcessTime }}min</div>
          <div class="metric-change negative">↘️ -{{ liveMetrics.timeReduction }}%</div>
        </div>
        <div class="metric-card alerts">
          <div class="metric-header">
            <span class="metric-icon">🚨</span>
            <h4>Alertes</h4>
          </div>
          <div class="metric-value">{{ liveMetrics.activeAlerts }}</div>
          <div class="metric-change" :class="liveMetrics.activeAlerts > 0 ? 'negative' : 'neutral'">
            {{ liveMetrics.activeAlerts > 0 ? '⚠️ Attention' : '✅ RAS' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Données en temps réel -->
    <div class="live-data-section">
      <div class="section-header">
        <h3>📊 Données en Direct</h3>
        <div class="data-controls">
          <span class="last-update">Dernière MAJ: {{ lastUpdate }}</span>
          <button class="btn btn-small" @click="refreshData">🔄 Actualiser</button>
        </div>
      </div>
      
      <div class="live-grid">
        <ag-grid-vue
          class="ag-theme-alpine skynet-grid"
          :columnDefs="liveColumnDefs"
          :rowData="liveData"
          :defaultColDef="defaultColDef"
          :gridOptions="liveGridOptions"
          @grid-ready="onGridReady">
        </ag-grid-vue>
      </div>
    </div>

    <!-- Alertes et notifications -->
    <div class="alerts-section">
      <h3>🚨 Alertes en Cours</h3>
      <div class="alerts-list">
        <div v-for="alert in activeAlertsList" :key="alert.id" 
             :class="['alert-item', alert.severity]">
          <div class="alert-icon">
            {{ alert.severity === 'critical' ? '🔴' : 
               alert.severity === 'warning' ? '🟡' : '🟢' }}
          </div>
          <div class="alert-content">
            <strong>{{ alert.title }}</strong>
            <p>{{ alert.message }}</p>
            <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
          </div>
          <div class="alert-actions">
            <button class="btn-small" @click="acknowledgeAlert(alert.id)">✓ Acquitter</button>
            <button class="btn-small" @click="dismissAlert(alert.id)">× Ignorer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphique de performance en temps réel -->
    <div class="performance-section">
      <h3>📈 Performance en Temps Réel</h3>
      <div class="chart-container">
        <div class="chart-placeholder">
          <div class="live-chart">
            <div v-for="(point, index) in performanceChart" :key="index" 
                 class="chart-point" 
                 :style="{ height: point + '%', left: (index * 2) + '%' }">
            </div>
          </div>
          <div class="chart-labels">
            <span>-30s</span>
            <span>-20s</span>
            <span>-10s</span>
            <span>Maintenant</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de filtres -->
    <div v-if="showFilterModal" class="modal-overlay" @click="showFilterModal = false">
      <div class="modal-content" @click.stop>
        <h3>🔍 Ajouter un Filtre</h3>
        <div class="filter-form">
          <div class="form-group">
            <label>Champ:</label>
            <select v-model="newFilter.field">
              <option value="statut">Statut</option>
              <option value="location">Location</option>
              <option value="priority">Priorité</option>
              <option value="vrid">VRID</option>
            </select>
          </div>
          <div class="form-group">
            <label>Condition:</label>
            <select v-model="newFilter.condition">
              <option value="equals">Égal à</option>
              <option value="contains">Contient</option>
              <option value="greater">Supérieur à</option>
              <option value="less">Inférieur à</option>
            </select>
          </div>
          <div class="form-group">
            <label>Valeur:</label>
            <input type="text" v-model="newFilter.value" placeholder="Valeur du filtre">
          </div>
          <div class="modal-actions">
            <button class="btn btn-success" @click="addFilter">Ajouter</button>
            <button class="btn btn-secondary" @click="showFilterModal = false">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

export default {
  name: 'SkynetData',
  components: {
    AgGridVue
  },
  data() {
    return {
      connectionStatus: 'disconnected', // connected, connecting, disconnected
      refreshInterval: 5000,
      isPaused: false,
      lastUpdate: '',
      refreshTimer: null,
      showFilterModal: false,
      activeFilters: ['Status: Active', 'Priority: High'],
      newFilter: {
        field: 'statut',
        condition: 'equals',
        value: ''
      },
      liveMetrics: {
        activeVRIDs: 24,
        vridChange: 3,
        throughputPerHour: 156,
        throughputChange: 12.5,
        avgProcessTime: 14.2,
        timeReduction: 8.3,
        activeAlerts: 2
      },
      liveData: [
        {
          id: 1,
          vrid: 'VR240006',
          statut: 'IN PROGRESS',
          location: 'DOCK-A1',
          priority: 'HIGH',
          progress: 75,
          eta: '14:30',
          realTime: true
        },
        {
          id: 2,
          vrid: 'VR240007',
          statut: 'LOADING',
          location: 'DOCK-B2',
          priority: 'MEDIUM',
          progress: 45,
          eta: '15:15',
          realTime: true
        },
        {
          id: 3,
          vrid: 'VR240008',
          statut: 'PENDING',
          location: 'QUEUE-1',
          priority: 'LOW',
          progress: 0,
          eta: '16:00',
          realTime: true
        }
      ],
      activeAlertsList: [
        {
          id: 1,
          severity: 'critical',
          title: 'Délai dépassé',
          message: 'VRID VR240001 dépasse le délai prévu de 2 heures',
          timestamp: new Date(Date.now() - 15 * 60 * 1000)
        },
        {
          id: 2,
          severity: 'warning',
          title: 'Capacité dock',
          message: 'DOCK-A1 approche de la capacité maximale',
          timestamp: new Date(Date.now() - 8 * 60 * 1000)
        }
      ],
      performanceChart: [60, 65, 70, 68, 75, 80, 85, 88, 82, 79, 83, 87, 90, 85, 88, 92, 89, 91, 94, 96],
      liveColumnDefs: [
        {
          field: 'vrid',
          headerName: 'VRID',
          width: 120,
          pinned: 'left',
          cellStyle: { fontWeight: 'bold' }
        },
        {
          field: 'statut',
          headerName: 'Statut',
          width: 130,
          cellRenderer: this.statusCellRenderer
        },
        {
          field: 'location',
          headerName: 'Location',
          width: 110
        },
        {
          field: 'priority',
          headerName: 'Priorité',
          width: 100,
          cellRenderer: this.priorityCellRenderer
        },
        {
          field: 'progress',
          headerName: 'Progression',
          width: 150,
          cellRenderer: this.progressCellRenderer
        },
        {
          field: 'eta',
          headerName: 'ETA',
          width: 100,
          cellStyle: { fontWeight: 'bold' }
        },
        {
          field: 'realTime',
          headerName: 'Live',
          width: 80,
          cellRenderer: params => params.value ? '🟢 LIVE' : '⚪ Static'
        }
      ],
      defaultColDef: {
        sortable: true,
        resizable: true,
        minWidth: 80
      },
      liveGridOptions: {
        animateRows: true,
        enableCellTextSelection: true,
        suppressMenuHide: true,
        rowHeight: 40
      }
    }
  },
  methods: {
    toggleConnection() {
      if (this.connectionStatus === 'connected') {
        this.disconnect();
      } else {
        this.connect();
      }
    },
    connect() {
      this.connectionStatus = 'connecting';
      
      // Simulation de connexion
      setTimeout(() => {
        this.connectionStatus = 'connected';
        this.startRealTimeUpdates();
        this.showNotification('Connexion Skynet établie', 'success');
      }, 2000);
    },
    disconnect() {
      this.connectionStatus = 'disconnected';
      this.stopRealTimeUpdates();
      this.showNotification('Connexion Skynet fermée', 'info');
    },
    startRealTimeUpdates() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
      
      this.refreshTimer = setInterval(() => {
        if (!this.isPaused && this.connectionStatus === 'connected') {
          this.updateLiveData();
        }
      }, this.refreshInterval);
    },
    stopRealTimeUpdates() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },
    updateRefreshRate() {
      if (this.connectionStatus === 'connected') {
        this.startRealTimeUpdates();
      }
    },
    pauseUpdates() {
      this.isPaused = !this.isPaused;
      this.showNotification(
        this.isPaused ? 'Mises à jour en pause' : 'Mises à jour reprises', 
        'info'
      );
    },
    updateLiveData() {
      // Simulation de mise à jour des données
      this.liveMetrics.activeVRIDs += Math.floor(Math.random() * 3) - 1;
      this.liveMetrics.throughputPerHour += Math.floor(Math.random() * 10) - 5;
      this.liveMetrics.avgProcessTime += (Math.random() - 0.5) * 2;
      
      // Update progress
      this.liveData.forEach(item => {
        if (item.statut === 'IN PROGRESS' || item.statut === 'LOADING') {
          item.progress = Math.min(100, item.progress + Math.floor(Math.random() * 5));
        }
      });
      
      // Update chart
      this.performanceChart.shift();
      this.performanceChart.push(Math.floor(Math.random() * 40) + 60);
      
      this.lastUpdate = new Date().toLocaleTimeString('fr-FR');
    },
    refreshData() {
      this.updateLiveData();
      this.showNotification('Données actualisées', 'info');
    },
    onGridReady(params) {
      this.gridApi = params.api;
    },
    statusCellRenderer(params) {
      const status = params.value;
      const colors = {
        'IN PROGRESS': '#3498db',
        'LOADING': '#f39c12',
        'PENDING': '#95a5a6',
        'DONE': '#27ae60'
      };
      
      return `<span style="color: ${colors[status] || '#2c3e50'}; font-weight: bold;">
                🔄 ${status}
              </span>`;
    },
    priorityCellRenderer(params) {
      const priority = params.value;
      const colors = {
        'HIGH': '#e74c3c',
        'MEDIUM': '#f39c12',
        'LOW': '#27ae60'
      };
      
      const icons = {
        'HIGH': '🔴',
        'MEDIUM': '🟡',
        'LOW': '🟢'
      };
      
      return `<span style="color: ${colors[priority]}; font-weight: bold;">
                ${icons[priority]} ${priority}
              </span>`;
    },
    progressCellRenderer(params) {
      const progress = params.value;
      return `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 60px; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
            <div style="width: ${progress}%; height: 100%; background: #3498db; transition: width 0.5s ease;"></div>
          </div>
          <span style="font-size: 12px; font-weight: bold;">${progress}%</span>
        </div>
      `;
    },
    addFilter() {
      if (this.newFilter.field && this.newFilter.value) {
        const filterText = `${this.newFilter.field}: ${this.newFilter.value}`;
        if (!this.activeFilters.includes(filterText)) {
          this.activeFilters.push(filterText);
        }
        this.newFilter = { field: 'statut', condition: 'equals', value: '' };
        this.showFilterModal = false;
      }
    },
    removeFilter(filter) {
      const index = this.activeFilters.indexOf(filter);
      if (index > -1) {
        this.activeFilters.splice(index, 1);
      }
    },
    acknowledgeAlert(alertId) {
      const index = this.activeAlertsList.findIndex(alert => alert.id === alertId);
      if (index > -1) {
        this.activeAlertsList.splice(index, 1);
        this.liveMetrics.activeAlerts--;
      }
    },
    dismissAlert(alertId) {
      this.acknowledgeAlert(alertId);
    },
    exportSnapshot() {
      const snapshot = {
        timestamp: new Date().toISOString(),
        metrics: this.liveMetrics,
        data: this.liveData,
        alerts: this.activeAlertsList
      };
      
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `skynet_snapshot_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
    formatTime(date) {
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (minutes < 60) {
        return `il y a ${minutes}min`;
      }
      return `il y a ${Math.floor(minutes / 60)}h${minutes % 60}`;
    },
    showNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  },
  mounted() {
    this.lastUpdate = new Date().toLocaleTimeString('fr-FR');
  },
  beforeUnmount() {
    this.stopRealTimeUpdates();
  }
}
</script>

<style scoped>
.skynet-container {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
}

.skynet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: rgba(255,255,255,0.1);
  padding: 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.skynet-header h2 {
  color: white;
  margin: 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.connected {
  background: #27ae60;
}

.status-indicator.connecting {
  background: #f39c12;
}

.status-indicator.disconnected {
  background: #e74c3c;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.control-panel {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  font-weight: bold;
  white-space: nowrap;
}

.control-group select {
  padding: 8px;
  border-radius: 4px;
  border: none;
  background: white;
}

.filter-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.filter-tag {
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-weight: bold;
}

.metrics-section {
  margin-bottom: 30px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.metric-card {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.metric-icon {
  font-size: 1.5rem;
}

.metric-header h4 {
  margin: 0;
  color: rgba(255,255,255,0.9);
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.metric-change {
  font-size: 0.9rem;
  font-weight: bold;
}

.metric-change.positive { color: #2ecc71; }
.metric-change.negative { color: #e74c3c; }
.metric-change.neutral { color: rgba(255,255,255,0.7); }

.live-data-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  color: #2c3e50;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.data-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.last-update {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.live-grid {
  height: 300px;
}

.skynet-grid {
  border-radius: 8px;
  overflow: hidden;
}

.alerts-section {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
}

.alert-item.critical {
  border-left: 4px solid #e74c3c;
}

.alert-item.warning {
  border-left: 4px solid #f39c12;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  margin-bottom: 5px;
}

.alert-content p {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.alert-time {
  font-size: 0.8rem;
  opacity: 0.7;
}

.alert-actions {
  display: flex;
  gap: 5px;
}

.performance-section {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.chart-container {
  margin-top: 20px;
}

.chart-placeholder {
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 20px;
  height: 200px;
  position: relative;
}

.live-chart {
  position: relative;
  height: 150px;
  width: 100%;
}

.chart-point {
  position: absolute;
  bottom: 0;
  width: 2px;
  background: #2ecc71;
  border-radius: 1px;
  transition: height 0.5s ease;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  color: #2c3e50;
}

.filter-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: bold;
}

.form-group select,
.form-group input {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .skynet-container {
    padding: 10px;
  }
  
  .skynet-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>