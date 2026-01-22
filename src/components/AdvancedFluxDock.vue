<template>
  <div class="advanced-flux-dock">
    <!-- Barre d'outils avec actions VBA -->
    <div class="toolbar-advanced">
      <div class="toolbar-left">
        <button class="btn btn-success" @click="refreshData">
          🔄 Actualiser
        </button>
        <button class="btn btn-info" @click="toggleAutoRefresh">
          {{ settings.autoRefresh ? '⏸️ Pause Auto' : '▶️ Auto Refresh' }}
        </button>
        <button class="btn btn-warning" @click="sortByFIFO">
          📅 Tri FIFO
        </button>
        <button class="btn" @click="exportData">
          📤 Export Excel
        </button>
      </div>
      <div class="toolbar-right">
        <div class="status-summary-advanced">
          <div class="status-item in-progress" @click="filterByStatus('IN PROGRESS')">
            <span class="status-icon">🔄</span>
            <span class="status-count">{{ metrics.statusCounts['IN PROGRESS'] }}</span>
            <span class="status-label">IN PROGRESS</span>
          </div>
          <div class="status-item vrac" @click="filterByStatus('VRAC')">
            <span class="status-icon">📦</span>
            <span class="status-count">{{ metrics.statusCounts['VRAC'] }}</span>
            <span class="status-label">VRAC</span>
          </div>
          <div class="status-item palettized" @click="filterByStatus('PALETTIZED')">
            <span class="status-icon">🏗️</span>
            <span class="status-count">{{ metrics.statusCounts['PALETTIZED'] }}</span>
            <span class="status-label">PALETTIZED</span>
          </div>
          <div class="status-item done" @click="filterByStatus('DONE')">
            <span class="status-icon">✅</span>
            <span class="status-count">{{ metrics.statusCounts['DONE'] }}</span>
            <span class="status-label">DONE</span>
          </div>
        </div>
        <span class="backlog-info">📋 Backlog: {{ metrics.backlogCount }}</span>
      </div>
    </div>

    <!-- Alertes prioritaires -->
    <div v-if="priorityAlerts.length > 0" class="priority-alerts">
      <div v-for="alert in priorityAlerts" :key="alert.id" 
           :class="['alert-item', alert.type]">
        <span class="alert-icon">
          {{ alert.type === 'critical' ? '🚨' : '⚠️' }}
        </span>
        <span class="alert-message">{{ alert.message }}</span>
        <button class="btn-small" @click="acknowledgeAlert(alert.id)">✓</button>
      </div>
    </div>

    <!-- Grille avancée avec mouvements -->
    <div class="advanced-grid-container">
      <ag-grid-vue
        class="ag-theme-alpine advanced-logistics-grid"
        :columnDefs="advancedColumnDefs"
        :rowData="filteredData"
        :defaultColDef="defaultColDef"
        :gridOptions="gridOptions"
        @row-selected="onRowSelected"
        @cell-value-changed="onCellValueChanged"
        @grid-ready="onGridReady">
      </ag-grid-vue>
    </div>

    <!-- Panel de contrôle pour VRID sélectionné -->
    <div v-if="selectedVRID" class="vrid-control-panel">
      <h3>🎛️ Contrôle VRID: {{ selectedVRID.vrid }}</h3>
      
      <div class="control-sections">
        <!-- Mouvements de statut -->
        <div class="control-section">
          <h4>🔄 Déplacements</h4>
          <div class="movement-buttons">
            <button 
              v-for="transition in getValidTransitions(selectedVRID.statut)"
              :key="transition"
              :class="['btn', 'movement-btn', getStatusClass(transition)]"
              @click="moveVRIDStatus(selectedVRID.id, transition)"
            >
              {{ selectedVRID.statut }} → {{ transition }}
            </button>
          </div>
        </div>

        <!-- Gestion des emplacements -->
        <div class="control-section">
          <h4>📍 Emplacement</h4>
          <div class="location-controls">
            <label>Location actuelle: <strong>{{ selectedVRID.location }}</strong></label>
            <select v-model="selectedLocation" @change="updateVRIDLocation">
              <option value="">-- Choisir nouvelle location --</option>
              <optgroup label="Quais disponibles">
                <option 
                  v-for="location in availableLocations.QUAI" 
                  :key="location"
                  :value="location"
                >
                  {{ location }}
                </option>
              </optgroup>
              <optgroup label="Stocks disponibles" v-if="selectedVRID.statut === 'DONE'">
                <option 
                  v-for="location in availableLocations.STOCK" 
                  :key="location"
                  :value="location"
                >
                  {{ location }}
                </option>
              </optgroup>
            </select>
          </div>
        </div>

        <!-- Gestion de priorité -->
        <div class="control-section">
          <h4>⚡ Priorité</h4>
          <div class="priority-controls">
            <button 
              v-for="priority in ['HIGH', 'MEDIUM', 'LOW']"
              :key="priority"
              :class="['btn', 'priority-btn', priority.toLowerCase(), { active: selectedVRID.priority === priority }]"
              @click="updatePriority(selectedVRID.id, priority)"
            >
              {{ getPriorityIcon(priority) }} {{ priority }}
            </button>
          </div>
        </div>

        <!-- Informations temporelles -->
        <div class="control-section">
          <h4>⏰ Temps</h4>
          <div class="time-info">
            <div class="time-item">
              <label>Temps écoulé:</label>
              <span>{{ formatElapsedTime(selectedVRID) }}</span>
            </div>
            <div class="time-item">
              <label>Temps restant:</label>
              <span :class="{ 'time-warning': selectedVRID.timeRemaining < 3600000 }">
                {{ selectedVRID.timeRemaining ? formatTime(selectedVRID.timeRemaining) : 'Dépassé' }}
              </span>
            </div>
            <div class="time-item">
              <label>Position backlog:</label>
              <span>#{{ selectedVRID.backlogPosition || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Métriques en temps réel -->
    <div class="metrics-dashboard">
      <div class="metric-card">
        <span class="metric-icon">🚛</span>
        <div class="metric-content">
          <h4>{{ metrics.totalVRID }}</h4>
          <p>Total VRID</p>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon">🏗️</span>
        <div class="metric-content">
          <h4>{{ metrics.totalPallets }}</h4>
          <p>Palettes</p>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon">📋</span>
        <div class="metric-content">
          <h4>{{ metrics.totalBT }}</h4>
          <p>BT Total</p>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon">📦</span>
        <div class="metric-content">
          <h4>{{ metrics.totalUnits.toLocaleString() }}</h4>
          <p>Unités</p>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon">⏱️</span>
        <div class="metric-content">
          <h4>{{ formatTime(metrics.averageProcessingTime) }}</h4>
          <p>Temps moyen</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import logisticsStore, { logisticsActions, logisticsGetters, CONFIG } from '../stores/logisticsStore.js'

export default {
  name: 'AdvancedFluxDock',
  components: {
    AgGridVue
  },
  data() {
    return {
      selectedVRID: null,
      selectedLocation: '',
      currentFilter: null,
      gridApi: null,
      refreshTimer: null,
      
      advancedColumnDefs: [
        {
          field: 'backlogPosition',
          headerName: '#',
          width: 60,
          pinned: 'left',
          cellStyle: { fontWeight: 'bold', textAlign: 'center' },
          valueFormatter: params => params.value || '-'
        },
        {
          field: 'statut',
          headerName: 'Statut',
          width: 140,
          pinned: 'left',
          cellRenderer: this.statusCellRenderer,
          editable: false
        },
        {
          field: 'vrid',
          headerName: 'VRID',
          width: 120,
          pinned: 'left',
          cellStyle: { fontWeight: 'bold', color: '#2c3e50' }
        },
        {
          field: 'priority',
          headerName: 'Priorité',
          width: 100,
          cellRenderer: this.priorityCellRenderer
        },
        {
          field: 'pallets',
          headerName: 'PALLETS',
          width: 90,
          type: 'numericColumn',
          editable: true,
          cellStyle: { textAlign: 'center' }
        },
        {
          field: 'bt',
          headerName: 'BT',
          width: 70,
          type: 'numericColumn',
          editable: true,
          cellStyle: { textAlign: 'center' }
        },
        {
          field: 'units',
          headerName: 'UNITS',
          width: 100,
          type: 'numericColumn',
          editable: true,
          valueFormatter: params => params.value.toLocaleString()
        },
        {
          field: 'sbd',
          headerName: 'SBD',
          width: 140,
          valueFormatter: params => new Date(params.value).toLocaleString('fr-FR')
        },
        {
          field: 'ymsArrivalTime',
          headerName: 'YMS Arrival',
          width: 140,
          valueFormatter: params => new Date(params.value).toLocaleString('fr-FR')
        },
        {
          field: 'location',
          headerName: 'LOCATION',
          width: 120,
          cellStyle: { fontWeight: 'bold' },
          editable: true,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: this.getLocationOptions
        },
        {
          field: 'remorques',
          headerName: 'REMORQUES',
          width: 120,
          editable: true
        },
        {
          field: 'timeRemaining',
          headerName: 'Temps Restant',
          width: 130,
          cellRenderer: this.timeRemainingRenderer
        },
        {
          field: 'statutDetaille',
          headerName: 'Détails',
          width: 200,
          editable: true
        },
        {
          field: 'fcSource',
          headerName: 'Source',
          width: 120,
          cellRenderer: this.sourceCellRenderer
        },
        {
          headerName: 'Actions',
          width: 150,
          cellRenderer: this.actionCellRenderer,
          pinned: 'right'
        }
      ],
      
      defaultColDef: {
        sortable: true,
        resizable: true,
        filter: true,
        minWidth: 70
      },

      gridOptions: {
        animateRows: true,
        enableCellTextSelection: true,
        pagination: true,
        paginationPageSize: 20,
        rowSelection: 'single',
        enableRangeSelection: true,
        suppressMenuHide: true,
        rowHeight: 45,
        headerHeight: 45,
        onCellEditingStopped: this.onCellEditingStopped
      }
    }
  },

  computed: {
    store() {
      return logisticsStore.store
    },
    metrics() {
      return logisticsStore.store.metrics
    },
    settings() {
      return logisticsStore.store.settings
    },
    priorityAlerts() {
      return logisticsGetters.activeAlerts.value.slice(0, 3)
    },
    availableLocations() {
      return logisticsGetters.availableLocations.value
    },
    filteredData() {
      let data = logisticsStore.store.vridData
      if (this.currentFilter) {
        data = data.filter(v => v.statut === this.currentFilter)
      }
      return data
    }
  },

  methods: {
    // Fonctions de rendu des cellules
    statusCellRenderer(params) {
      const status = params.value
      const icons = {
        'IN PROGRESS': '🔄',
        'VRAC': '📦',
        'PALETTIZED': '🏗️',
        'DONE': '✅'
      }
      const colors = {
        'IN PROGRESS': '#3498db',
        'VRAC': '#f39c12',
        'PALETTIZED': '#9b59b6',
        'DONE': '#27ae60'
      }
      
      return `<span style="background: ${colors[status]}; color: white; padding: 4px 8px; border-radius: 15px; font-size: 11px; font-weight: bold;">
                ${icons[status]} ${status}
              </span>`
    },

    priorityCellRenderer(params) {
      const priority = params.value
      const icons = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }
      const colors = { HIGH: '#e74c3c', MEDIUM: '#f39c12', LOW: '#27ae60' }
      
      return `<span style="color: ${colors[priority]}; font-weight: bold;">
                ${icons[priority]} ${priority}
              </span>`
    },

    timeRemainingRenderer(params) {
      const timeRemaining = params.value
      if (!timeRemaining || timeRemaining <= 0) {
        return '<span style="color: #e74c3c; font-weight: bold;">⏰ DÉPASSÉ</span>'
      }
      
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
      const color = hours < 1 ? '#e74c3c' : hours < 2 ? '#f39c12' : '#27ae60'
      
      return `<span style="color: ${color}; font-weight: bold;">
                ${logisticsActions.formatTime(timeRemaining)}
              </span>`
    },

    sourceCellRenderer(params) {
      const source = params.value
      const colors = {
        'AFT-SYSTEM': '#e74c3c',
        'FMC-SYSTEM': '#f39c12',
        'SKYNET': '#9b59b6'
      }
      
      return `<span style="color: ${colors[source]}; font-weight: bold;">
                ${source}
              </span>`
    },

    actionCellRenderer(params) {
      return `
        <div style="display: flex; gap: 4px;">
          <button class="grid-btn move" onclick="window.moveVRID('${params.data.id}')">🔄</button>
          <button class="grid-btn priority" onclick="window.setPriority('${params.data.id}')">⚡</button>
          <button class="grid-btn details" onclick="window.showDetails('${params.data.id}')">ℹ️</button>
        </div>
      `
    },

    // Fonctions de mouvement et gestion
    moveVRIDStatus(vridId, newStatus) {
      const success = logisticsActions.moveVRIDStatus(vridId, newStatus)
      if (success) {
        this.refreshGrid()
        this.showNotification('Déplacement effectué', 'success')
      }
    },

    updateVRIDLocation() {
      if (this.selectedVRID && this.selectedLocation) {
        this.selectedVRID.location = this.selectedLocation
        this.selectedVRID.updatedAt = new Date()
        this.refreshGrid()
        this.selectedLocation = ''
        this.showNotification('Emplacement mis à jour', 'success')
      }
    },

    updatePriority(vridId, newPriority) {
      logisticsActions.updateVRIDPriority(vridId, newPriority)
      this.refreshGrid()
      this.showNotification(`Priorité mise à jour: ${newPriority}`, 'info')
    },

    getValidTransitions(currentStatus) {
      const transitions = {
        'IN PROGRESS': ['DONE', 'VRAC'],
        'VRAC': ['PALETTIZED', 'DONE'],
        'PALETTIZED': ['DONE'],
        'DONE': []
      }
      return transitions[currentStatus] || []
    },

    getStatusClass(status) {
      return status.toLowerCase().replace(' ', '-')
    },

    getPriorityIcon(priority) {
      const icons = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }
      return icons[priority]
    },

    getLocationOptions() {
      const allLocations = [
        ...CONFIG.LOCATIONS.QUAI,
        ...CONFIG.LOCATIONS.STOCK,
        ...CONFIG.LOCATIONS.QUEUE
      ]
      return { values: allLocations }
    },

    // Fonctions de tri et filtrage
    sortByFIFO() {
      logisticsActions.sortVRIDByFIFO()
      this.refreshGrid()
      this.showNotification('Tri FIFO appliqué', 'info')
    },

    filterByStatus(status) {
      this.currentFilter = this.currentFilter === status ? null : status
      this.refreshGrid()
    },

    // Fonctions utilitaires
    formatElapsedTime(vrid) {
      const elapsed = new Date() - vrid.createdAt
      return logisticsActions.formatTime(elapsed)
    },

    formatTime(milliseconds) {
      return logisticsActions.formatTime(milliseconds)
    },

    // Gestion des événements
    onGridReady(params) {
      this.gridApi = params.api
      params.api.sizeColumnsToFit()
      
      // Actions globales pour les boutons dans la grille
      window.moveVRID = (vridId) => {
        const vrid = logisticsStore.store.vridData.find(v => v.id == vridId)
        if (vrid) {
          this.selectedVRID = vrid
        }
      }
      
      window.setPriority = (vridId) => {
        const vrid = logisticsStore.store.vridData.find(v => v.id == vridId)
        if (vrid) {
          const newPriority = vrid.priority === 'HIGH' ? 'MEDIUM' : 
                             vrid.priority === 'MEDIUM' ? 'LOW' : 'HIGH'
          this.updatePriority(vrid.id, newPriority)
        }
      }
      
      window.showDetails = (vridId) => {
        const vrid = logisticsStore.store.vridData.find(v => v.id == vridId)
        if (vrid) {
          this.selectedVRID = vrid
        }
      }
    },

    onRowSelected(event) {
      this.selectedVRID = event.data
    },

    onCellValueChanged(event) {
      // Mise à jour automatique lors de l'édition
      event.data.updatedAt = new Date()
      logisticsActions.updateMetrics()
    },

    onCellEditingStopped(event) {
      if (event.column.colId === 'location') {
        logisticsActions.updateMetrics()
      }
    },

    // Fonctions de contrôle
    refreshData() {
      logisticsActions.updateMetrics()
      logisticsActions.updateBacklog()
      logisticsActions.updateTimeRemaining()
      this.refreshGrid()
      this.showNotification('Données actualisées', 'info')
    },

    refreshGrid() {
      if (this.gridApi) {
        this.gridApi.setRowData(this.filteredData)
      }
    },

    toggleAutoRefresh() {
      logisticsStore.store.settings.autoRefresh = !logisticsStore.store.settings.autoRefresh
      
      if (logisticsStore.store.settings.autoRefresh) {
        this.startAutoRefresh()
        this.showNotification('Auto-refresh activé', 'success')
      } else {
        this.stopAutoRefresh()
        this.showNotification('Auto-refresh désactivé', 'warning')
      }
    },

    startAutoRefresh() {
      this.refreshTimer = setInterval(() => {
        this.refreshData()
      }, logisticsStore.store.settings.refreshInterval)
    },

    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },

    acknowledgeAlert(alertId) {
      const index = logisticsStore.store.alerts.findIndex(a => a.id === alertId)
      if (index > -1) {
        logisticsStore.store.alerts.splice(index, 1)
      }
    },

    exportData() {
      // Simulation d'export Excel (équivalent de votre export VBA)
      const csvData = this.convertToCSV(this.filteredData)
      this.downloadCSV(csvData, `flux_dock_export_${new Date().toISOString().split('T')[0]}.csv`)
    },

    convertToCSV(data) {
      const headers = [
        'VRID', 'Statut', 'Priorité', 'Pallets', 'BT', 'Units', 
        'SBD', 'YMS Arrival', 'Location', 'Remorques', 'Source', 'Position Backlog'
      ]
      
      const rows = data.map(row => [
        row.vrid,
        row.statut,
        row.priority,
        row.pallets,
        row.bt,
        row.units,
        new Date(row.sbd).toLocaleString('fr-FR'),
        new Date(row.ymsArrivalTime).toLocaleString('fr-FR'),
        row.location,
        row.remorques,
        row.fcSource,
        row.backlogPosition || ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    },

    downloadCSV(csvContent, filename) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    showNotification(message, type) {
      logisticsActions.addAlert({
        type: type,
        message: message
      })
    }
  },

  mounted() {
    // Démarrer les mises à jour automatiques
    logisticsActions.startAutoUpdates()
    this.startAutoRefresh()
    
    // Mise à jour initiale des données
    this.refreshData()
  },

  beforeUnmount() {
    this.stopAutoRefresh()
  }
}
</script>

<style scoped>
.advanced-flux-dock {
  padding: 20px;
}

.toolbar-advanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.status-summary-advanced {
  display: flex;
  gap: 15px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
  border: 2px solid transparent;
}

.status-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.status-item.in-progress:hover { border-color: #3498db; }
.status-item.vrac:hover { border-color: #f39c12; }
.status-item.palettized:hover { border-color: #9b59b6; }
.status-item.done:hover { border-color: #27ae60; }

.status-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.status-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.status-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: bold;
}

.backlog-info {
  background: #e3f2fd;
  padding: 8px 12px;
  border-radius: 6px;
  color: #1976d2;
  font-weight: bold;
}

.priority-alerts {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.alert-item.critical {
  border-left: 4px solid #e74c3c;
  background: #fdf2f2;
}

.alert-item.warning {
  border-left: 4px solid #f39c12;
  background: #fef9e7;
}

.alert-icon {
  font-size: 1.2rem;
}

.alert-message {
  flex: 1;
  font-weight: 500;
}

.advanced-grid-container {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.advanced-logistics-grid {
  height: 600px;
  width: 100%;
}

.vrid-control-panel {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border-left: 4px solid #3498db;
}

.control-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.control-section {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.control-section h4 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.movement-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.movement-btn {
  padding: 8px 12px;
  font-size: 0.9rem;
}

.movement-btn.in-progress { background: #3498db; }
.movement-btn.vrac { background: #f39c12; }
.movement-btn.palettized { background: #9b59b6; }
.movement-btn.done { background: #27ae60; }

.location-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-controls select {
  padding: 8px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
}

.priority-controls {
  display: flex;
  gap: 8px;
}

.priority-btn {
  padding: 6px 12px;
  font-size: 0.8rem;
  border: 2px solid transparent;
}

.priority-btn.high { background: #e74c3c; }
.priority-btn.medium { background: #f39c12; }
.priority-btn.low { background: #27ae60; }

.priority-btn.active {
  border-color: #2c3e50;
  box-shadow: 0 0 5px rgba(44, 62, 80, 0.3);
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
}

.time-item:last-child {
  border-bottom: none;
}

.time-warning {
  color: #e74c3c;
  font-weight: bold;
  animation: pulse 2s infinite;
}

.metrics-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.metric-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-icon {
  font-size: 2rem;
}

.metric-content h4 {
  font-size: 1.8rem;
  margin: 0;
  color: #2c3e50;
}

.metric-content p {
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-weight: bold;
}

/* Styles pour les boutons dans la grille */
:global(.grid-btn) {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

:global(.grid-btn:hover) {
  background: #2980b9;
  transform: scale(1.05);
}

:global(.grid-btn.move) { background: #3498db; }
:global(.grid-btn.priority) { background: #f39c12; }
:global(.grid-btn.details) { background: #17a2b8; }

@media (max-width: 768px) {
  .toolbar-advanced {
    flex-direction: column;
    gap: 15px;
  }
  
  .status-summary-advanced {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .control-sections {
    grid-template-columns: 1fr;
  }
  
  .priority-controls {
    flex-direction: column;
  }
}
</style>