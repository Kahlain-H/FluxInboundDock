<template>
  <div class="flux-dock-sections">
    <div class="flux-dock-header">
      <h2>🚛 Flux Dock Inbound - Gestion par Sections</h2>
      <p>Organisation structurée par statuts avec système de déplacement intégré</p>
      
      <!-- Barre d'outils générale -->
      <div class="main-toolbar">
        <div class="toolbar-left">
          <button class="btn btn-success" @click="refreshAllSections">
            🔄 Actualiser Tout
          </button>
          <button class="btn btn-info" @click="autoArrangeAll">
            🎯 Auto-Organisation
          </button>
          <button class="btn btn-warning" @click="validateAllLocations">
            ✅ Valider Emplacements
          </button>
        </div>
        <div class="toolbar-right">
          <div class="global-stats">
            <span class="stat-item">📦 Total: {{ getTotalVRID() }}</span>
            <span class="stat-item">⏳ En cours: {{ getSectionCount('IN PROGRESS') }}</span>
            <span class="stat-item">🔄 En traitement: {{ getSectionCount('VRAC') + getSectionCount('PALETTIZED') }}</span>
            <span class="stat-item">✅ Terminé: {{ getSectionCount('DONE') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section IN PROGRESS -->
    <div class="section-container in-progress-section">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">🔄</span>
          <h3>IN PROGRESS ({{ getSectionCount('IN PROGRESS') }})</h3>
        </div>
        <div class="section-actions">
          <button class="btn btn-add" @click="ajouterLigneInProgress">
            ➕ Ajouter ligne IN PROGRESS
          </button>
          <button class="btn btn-small" @click="collapseSection('IN PROGRESS')">
            {{ collapsedSections['IN PROGRESS'] ? '📖' : '📕' }}
          </button>
        </div>
      </div>
      
      <div v-if="!collapsedSections['IN PROGRESS']" class="section-grid">
        <ag-grid-vue
          class="ag-theme-alpine section-grid-component"
          :columnDefs="getColumnDefsForSection('IN PROGRESS')"
          :rowData="getSectionData('IN PROGRESS')"
          :gridOptions="getSectionGridOptions('IN PROGRESS')"
          @cell-value-changed="onCellValueChanged"
          @grid-ready="onGridReady">
        </ag-grid-vue>
      </div>
    </div>

    <!-- Section VRAC -->
    <div class="section-container vrac-section">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">📦</span>
          <h3>VRAC ({{ getSectionCount('VRAC') }})</h3>
        </div>
        <div class="section-actions">
          <button class="btn btn-add" @click="ajouterLigneVrac">
            ➕ Ajouter ligne VRAC
          </button>
          <button class="btn btn-small" @click="collapseSection('VRAC')">
            {{ collapsedSections['VRAC'] ? '📖' : '📕' }}
          </button>
        </div>
      </div>
      
      <div v-if="!collapsedSections['VRAC']" class="section-grid">
        <ag-grid-vue
          class="ag-theme-alpine section-grid-component"
          :columnDefs="getColumnDefsForSection('VRAC')"
          :rowData="getSectionData('VRAC')"
          :gridOptions="getSectionGridOptions('VRAC')"
          @cell-value-changed="onCellValueChanged"
          @grid-ready="onGridReady">
        </ag-grid-vue>
      </div>
    </div>

    <!-- Section PALETTIZED -->
    <div class="section-container palettized-section">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">🏗️</span>
          <h3>PALETTIZED ({{ getSectionCount('PALETTIZED') }})</h3>
        </div>
        <div class="section-actions">
          <button class="btn btn-add" @click="ajouterLignePalettized">
            ➕ Ajouter ligne PALETTIZED
          </button>
          <button class="btn btn-small" @click="collapseSection('PALETTIZED')">
            {{ collapsedSections['PALETTIZED'] ? '📖' : '📕' }}
          </button>
        </div>
      </div>
      
      <div v-if="!collapsedSections['PALETTIZED']" class="section-grid">
        <ag-grid-vue
          class="ag-theme-alpine section-grid-component"
          :columnDefs="getColumnDefsForSection('PALETTIZED')"
          :rowData="getSectionData('PALETTIZED')"
          :gridOptions="getSectionGridOptions('PALETTIZED')"
          @cell-value-changed="onCellValueChanged"
          @grid-ready="onGridReady">
        </ag-grid-vue>
      </div>
    </div>

    <!-- Section DONE -->
    <div class="section-container done-section">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">✅</span>
          <h3>DONE ({{ getSectionCount('DONE') }})</h3>
        </div>
        <div class="section-actions">
          <button class="btn btn-add" @click="ajouterLigneDone">
            ➕ Ajouter ligne DONE
          </button>
          <button class="btn btn-small" @click="collapseSection('DONE')">
            {{ collapsedSections['DONE'] ? '📖' : '📕' }}
          </button>
        </div>
      </div>
      
      <div v-if="!collapsedSections['DONE']" class="section-grid">
        <ag-grid-vue
          class="ag-theme-alpine section-grid-component"
          :columnDefs="getColumnDefsForSection('DONE')"
          :rowData="getSectionData('DONE')"
          :gridOptions="getSectionGridOptions('DONE')"
          @cell-value-changed="onCellValueChanged"
          @grid-ready="onGridReady">
        </ag-grid-vue>
      </div>
    </div>

    <!-- Modal de déplacement -->
    <div v-if="showMoveModal" class="move-modal-overlay" @click="closeMoveModal">
      <div class="move-modal" @click.stop>
        <div class="modal-header">
          <h3>🚀 Déplacer VRID: {{ selectedVRID?.vrid }}</h3>
          <button class="close-btn" @click="closeMoveModal">✕</button>
        </div>
        
        <div class="modal-content">
          <div class="current-status">
            <strong>Statut actuel:</strong> {{ selectedVRID?.statut }}
            <br>
            <strong>Location actuelle:</strong> {{ selectedVRID?.location }}
          </div>

          <div class="move-options">
            <h4>🎯 Déplacements possibles:</h4>
            <div class="move-buttons">
              <button 
                v-for="move in getValidMoves(selectedVRID?.statut)"
                :key="move.to"
                :class="['move-btn', move.to.toLowerCase().replace(' ', '-')]"
                @click="executeMoveVRID(move.to)"
              >
                {{ selectedVRID?.statut }} → {{ move.to }}
                <small>{{ move.description }}</small>
              </button>
            </div>
          </div>

          <div v-if="moveRequiresLocation" class="location-selection">
            <h4>📍 Sélectionner l'emplacement:</h4>
            <select v-model="selectedMoveLocation" class="location-dropdown">
              <option value="">-- Choisir emplacement --</option>
              <optgroup 
                v-for="(locations, type) in getAvailableLocations(targetMoveStatus)"
                :key="type"
                :label="type"
              >
                <option 
                  v-for="location in locations"
                  :key="location"
                  :value="location"
                  :disabled="isLocationOccupied(location)"
                >
                  {{ location }} {{ isLocationOccupied(location) ? '(Occupé)' : '' }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="validation-messages" v-if="moveValidationMessage">
            <div :class="['validation-message', moveValidationType]">
              {{ moveValidationMessage }}
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-success" @click="confirmMove" :disabled="!canConfirmMove">
            ✅ Confirmer le Déplacement
          </button>
          <button class="btn btn-secondary" @click="closeMoveModal">
            ❌ Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import logisticsStore, { logisticsActions } from '../stores/logisticsStore.js'

export default {
  name: 'FluxDockSections',
  components: {
    AgGridVue
  },
  
  data() {
    return {
      collapsedSections: {
        'IN PROGRESS': false,
        'VRAC': false,
        'PALETTIZED': false,
        'DONE': false
      },
      
      showMoveModal: false,
      selectedVRID: null,
      selectedMoveLocation: '',
      targetMoveStatus: '',
      moveRequiresLocation: false,
      moveValidationMessage: '',
      moveValidationType: 'info',
      
      // Configuration des emplacements (équivalent ListeQuaiInbound VBA)
      locationConfig: {
        'IN PROGRESS': {
          QUAI: ['QUAI_1', 'QUAI_2', 'QUAI_3', 'QUAI_4'],
          QUEUE: ['QUEUE_A', 'QUEUE_B', 'QUEUE_C']
        },
        'VRAC': {
          ZONE_VRAC: ['ZONE_VRAC_1', 'ZONE_VRAC_2', 'ZONE_VRAC_3'],
          QUAI: ['QUAI_1', 'QUAI_2', 'QUAI_3']
        },
        'PALETTIZED': {
          ZONE_PALETTE: ['ZONE_PALETTE_1', 'ZONE_PALETTE_2', 'ZONE_PALETTE_3'],
          STOCK_TEMP: ['STOCK_TEMP_A', 'STOCK_TEMP_B']
        },
        'DONE': {
          STOCK: ['STOCK_A', 'STOCK_B', 'STOCK_C', 'STOCK_D'],
          EXPEDIE: ['EXPEDIE_1', 'EXPEDIE_2']
        }
      },

      // Règles de déplacement (équivalent logique VBA)
      moveRules: {
        'IN PROGRESS': [
          { to: 'DONE', description: 'Terminer directement', requiresLocation: true },
          { to: 'VRAC', description: 'Envoyer en vrac', requiresLocation: true },
          { to: 'PALETTIZED', description: 'Palettiser directement', requiresLocation: true }
        ],
        'VRAC': [
          { to: 'PALETTIZED', description: 'Palettiser', requiresLocation: true },
          { to: 'DONE', description: 'Terminer', requiresLocation: true },
          { to: 'IN PROGRESS', description: 'Retour en cours (via location)', requiresLocation: true }
        ],
        'PALETTIZED': [
          { to: 'DONE', description: 'Terminer', requiresLocation: true },
          { to: 'IN PROGRESS', description: 'Retour en cours (via location)', requiresLocation: true }
        ],
        'DONE': []
      }
    }
  },

  computed: {
    canConfirmMove() {
      return this.targetMoveStatus && 
             (!this.moveRequiresLocation || this.selectedMoveLocation) &&
             this.moveValidationType !== 'error'
    }
  },

  methods: {
    // ===== GESTION DES SECTIONS =====
    
    getSectionData(status) {
      return logisticsStore.store.vridData.filter(vrid => vrid.statut === status)
    },

    getSectionCount(status) {
      return this.getSectionData(status).length
    },

    getTotalVRID() {
      return logisticsStore.store.vridData.length
    },

    collapseSection(status) {
      this.collapsedSections[status] = !this.collapsedSections[status]
    },

    // ===== CONFIGURATION DES COLONNES PAR SECTION =====
    
    getColumnDefsForSection(status) {
      const baseColumns = [
        {
          field: 'vrid',
          headerName: 'VRID',
          width: 120,
          pinned: 'left',
          cellStyle: { fontWeight: 'bold', textAlign: 'center' }
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
          cellStyle: { textAlign: 'center' },
          valueFormatter: params => params.value?.toLocaleString()
        },
        {
          field: 'sbd',
          headerName: 'SBD',
          width: 140,
          cellStyle: { textAlign: 'center' },
          valueFormatter: params => new Date(params.value).toLocaleString('fr-FR')
        },
        {
          field: 'ymsArrivalTime',
          headerName: 'YMS Arrival',
          width: 140,
          cellStyle: { textAlign: 'center' },
          valueFormatter: params => new Date(params.value).toLocaleString('fr-FR')
        },
        {
          field: 'location',
          headerName: 'LOCATION',
          width: 150,
          editable: true,
          cellStyle: { textAlign: 'center', fontWeight: 'bold' },
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: () => {
            return {
              values: this.getLocationOptionsForStatus(status)
            }
          },
          cellRenderer: this.locationCellRenderer
        },
        {
          field: 'remorques',
          headerName: 'REMORQUES',
          width: 120,
          editable: true,
          cellStyle: { textAlign: 'center' }
        }
      ]

      // Colonne de déplacement (colonne L équivalente)
      const moveColumn = {
        headerName: 'MOVE',
        width: 100,
        pinned: 'right',
        cellRenderer: this.moveCellRenderer,
        cellStyle: { textAlign: 'center' }
      }

      // Ajout de colonnes spécifiques selon le statut
      if (status === 'IN PROGRESS') {
        baseColumns.splice(1, 0, {
          field: 'priority',
          headerName: 'PRIORITÉ',
          width: 100,
          editable: true,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: { values: ['HIGH', 'MEDIUM', 'LOW'] },
          cellRenderer: this.priorityCellRenderer,
          cellStyle: { textAlign: 'center' }
        })
      }

      if (status === 'DONE') {
        baseColumns.push({
          field: 'completedAt',
          headerName: 'TERMINÉ LE',
          width: 140,
          cellStyle: { textAlign: 'center' },
          valueFormatter: params => params.value ? new Date(params.value).toLocaleString('fr-FR') : ''
        })
      }

      return [...baseColumns, moveColumn]
    },

    // ===== RENDERERS DE CELLULES =====
    
    moveCellRenderer(params) {
      const validMoves = this.getValidMoves(params.data.statut)
      if (validMoves.length === 0) {
        return '<span style="color: #95a5a6;">—</span>'
      }
      
      return `<button 
                class="move-cell-btn" 
                onclick="window.openMoveModal('${params.data.id}')"
                title="Déplacer ${params.data.vrid}">
                🚀 MOVE
              </button>`
    },

    locationCellRenderer(params) {
      const location = params.value
      const isOccupied = this.isLocationOccupied(location, params.data.id)
      
      let style = 'padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      if (isOccupied) {
        style += 'background: #ffebee; color: #c62828; border: 1px solid #ef5350;'
      } else {
        style += 'background: #e8f5e8; color: #2e7d32; border: 1px solid #66bb6a;'
      }
      
      return `<span style="${style}">${location || 'Non assigné'}</span>`
    },

    priorityCellRenderer(params) {
      const priority = params.value
      const colors = { 
        HIGH: '#e74c3c', 
        MEDIUM: '#f39c12', 
        LOW: '#27ae60' 
      }
      const icons = { 
        HIGH: '🔴', 
        MEDIUM: '🟡', 
        LOW: '🟢' 
      }
      
      return `<span style="color: ${colors[priority]}; font-weight: bold;">
                ${icons[priority]} ${priority}
              </span>`
    },

    // ===== OPTIONS DE GRILLE PAR SECTION =====
    
    getSectionGridOptions(status) {
      return {
        animateRows: true,
        enableCellTextSelection: true,
        rowSelection: 'single',
        enableRangeSelection: false,
        suppressMenuHide: true,
        rowHeight: 45,
        headerHeight: 40,
        
        // Styles conditionnels par section
        getRowStyle: (params) => {
          const baseStyle = { textAlign: 'center' }
          
          switch (status) {
            case 'IN PROGRESS':
              return { ...baseStyle, backgroundColor: '#e3f2fd' }
            case 'VRAC':
              return { ...baseStyle, backgroundColor: '#fff3e0' }
            case 'PALETTIZED':
              return { ...baseStyle, backgroundColor: '#f3e5f5' }
            case 'DONE':
              return { ...baseStyle, backgroundColor: '#e8f5e8' }
            default:
              return baseStyle
          }
        },
        
        onCellEditingStopped: (event) => {
          this.validateCellEdit(event)
        }
      }
    },

    // ===== FONCTIONS D'AJOUT DE LIGNES (équivalent AjouterLigne VBA) =====
    
    ajouterLigneInProgress() {
      const newVRID = this.createNewVRID('IN PROGRESS')
      logisticsStore.store.vridData.push(newVRID)
      logisticsActions.updateMetrics()
      this.showNotification(`✅ Nouvelle ligne IN PROGRESS ajoutée: ${newVRID.vrid}`, 'success')
    },

    ajouterLigneVrac() {
      const newVRID = this.createNewVRID('VRAC')
      logisticsStore.store.vridData.push(newVRID)
      logisticsActions.updateMetrics()
      this.showNotification(`✅ Nouvelle ligne VRAC ajoutée: ${newVRID.vrid}`, 'success')
    },

    ajouterLignePalettized() {
      const newVRID = this.createNewVRID('PALETTIZED')
      logisticsStore.store.vridData.push(newVRID)
      logisticsActions.updateMetrics()
      this.showNotification(`✅ Nouvelle ligne PALETTIZED ajoutée: ${newVRID.vrid}`, 'success')
    },

    ajouterLigneDone() {
      const newVRID = this.createNewVRID('DONE')
      newVRID.completedAt = new Date()
      logisticsStore.store.vridData.push(newVRID)
      logisticsActions.updateMetrics()
      this.showNotification(`✅ Nouvelle ligne DONE ajoutée: ${newVRID.vrid}`, 'success')
    },

    createNewVRID(statut) {
      const count = this.getSectionCount(statut) + 1
      const prefix = {
        'IN PROGRESS': 'IP',
        'VRAC': 'VR',
        'PALETTIZED': 'PL',
        'DONE': 'DN'
      }[statut]

      return {
        id: Date.now() + Math.random(),
        vrid: `${prefix}${String(count).padStart(3, '0')}`,
        statut: statut,
        pallets: 1,
        bt: 1,
        units: 100,
        sbd: new Date(),
        ymsArrivalTime: new Date(),
        location: this.getDefaultLocationForStatus(statut),
        remorques: '',
        priority: statut === 'IN PROGRESS' ? 'MEDIUM' : undefined,
        fcSource: 'MANUEL',
        statutDetaille: `Créé manuellement - ${statut}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },

    // ===== SYSTÈME DE DÉPLACEMENT =====
    
    openMoveModal(vridId) {
      const vrid = logisticsStore.store.vridData.find(v => v.id == vridId)
      if (vrid) {
        this.selectedVRID = vrid
        this.showMoveModal = true
        this.selectedMoveLocation = ''
        this.targetMoveStatus = ''
        this.moveRequiresLocation = false
        this.moveValidationMessage = ''
      }
    },

    closeMoveModal() {
      this.showMoveModal = false
      this.selectedVRID = null
      this.selectedMoveLocation = ''
      this.targetMoveStatus = ''
      this.moveRequiresLocation = false
      this.moveValidationMessage = ''
    },

    getValidMoves(currentStatus) {
      return this.moveRules[currentStatus] || []
    },

    executeMoveVRID(toStatus) {
      this.targetMoveStatus = toStatus
      const move = this.moveRules[this.selectedVRID.statut].find(m => m.to === toStatus)
      
      if (move) {
        this.moveRequiresLocation = move.requiresLocation
        
        if (this.moveRequiresLocation) {
          this.moveValidationMessage = `Sélectionnez un emplacement pour ${toStatus}`
          this.moveValidationType = 'info'
        } else {
          this.moveValidationMessage = ''
        }
      }
    },

    confirmMove() {
      if (!this.canConfirmMove) return

      // Validation de l'emplacement si requis
      if (this.moveRequiresLocation && this.isLocationOccupied(this.selectedMoveLocation)) {
        this.moveValidationMessage = `❌ Emplacement ${this.selectedMoveLocation} déjà occupé!`
        this.moveValidationType = 'error'
        return
      }

      // Exécution du déplacement
      const oldStatus = this.selectedVRID.statut
      const oldLocation = this.selectedVRID.location

      // Mise à jour du VRID
      this.selectedVRID.statut = this.targetMoveStatus
      if (this.selectedMoveLocation) {
        this.selectedVRID.location = this.selectedMoveLocation
      }
      this.selectedVRID.updatedAt = new Date()

      // Marquer comme terminé si DONE
      if (this.targetMoveStatus === 'DONE') {
        this.selectedVRID.completedAt = new Date()
      }

      // Mise à jour des métriques
      logisticsActions.updateMetrics()

      // Notification
      this.showNotification(
        `✅ ${this.selectedVRID.vrid} déplacé: ${oldStatus} → ${this.targetMoveStatus}`,
        'success'
      )

      // Fermeture du modal
      this.closeMoveModal()
    },

    // ===== VALIDATION DES DONNÉES =====
    
    getLocationOptionsForStatus(status) {
      const locations = []
      const config = this.locationConfig[status]
      
      if (config) {
        Object.values(config).forEach(locationArray => {
          locations.push(...locationArray)
        })
      }
      
      return locations
    },

    getDefaultLocationForStatus(status) {
      const config = this.locationConfig[status]
      if (config) {
        const firstGroup = Object.values(config)[0]
        return firstGroup[0] || ''
      }
      return ''
    },

    getAvailableLocations(status) {
      return this.locationConfig[status] || {}
    },

    isLocationOccupied(location, excludeId = null) {
      if (!location) return false
      
      return logisticsStore.store.vridData.some(vrid => 
        vrid.location === location && vrid.id !== excludeId
      )
    },

    validateCellEdit(event) {
      const field = event.column.colId
      const newValue = event.newValue
      const data = event.data

      if (field === 'location') {
        if (this.isLocationOccupied(newValue, data.id)) {
          this.showNotification(`❌ Emplacement ${newValue} déjà occupé!`, 'error')
          event.api.startEditingCell({
            rowIndex: event.rowIndex,
            colKey: field
          })
          return false
        }
      }

      // Validation des valeurs numériques
      if (['pallets', 'bt', 'units'].includes(field)) {
        if (newValue < 0) {
          this.showNotification(`❌ ${field} ne peut pas être négatif!`, 'error')
          return false
        }
      }

      // Mise à jour automatique
      data.updatedAt = new Date()
      logisticsActions.updateMetrics()
      
      return true
    },

    validateAllLocations() {
      let conflicts = 0
      const locationMap = new Map()

      logisticsStore.store.vridData.forEach(vrid => {
        if (vrid.location) {
          if (locationMap.has(vrid.location)) {
            conflicts++
          } else {
            locationMap.set(vrid.location, vrid.vrid)
          }
        }
      })

      if (conflicts > 0) {
        this.showNotification(`⚠️ ${conflicts} conflits d'emplacements détectés!`, 'warning')
      } else {
        this.showNotification(`✅ Tous les emplacements sont valides!`, 'success')
      }
    },

    // ===== FONCTIONS UTILITAIRES =====
    
    refreshAllSections() {
      logisticsActions.updateMetrics()
      logisticsActions.updateBacklog()
      logisticsActions.updateTimeRemaining()
      this.showNotification('🔄 Toutes les sections actualisées', 'info')
    },

    autoArrangeAll() {
      logisticsActions.sortVRIDByFIFO()
      this.showNotification('🎯 Auto-organisation appliquée', 'info')
    },

    onCellValueChanged(event) {
      this.validateCellEdit(event)
    },

    onGridReady(params) {
      // Configuration globale pour les actions dans les cellules
      window.openMoveModal = (vridId) => {
        this.openMoveModal(vridId)
      }
      
      // Redimensionnement automatique
      setTimeout(() => {
        params.api.sizeColumnsToFit()
      }, 100)
    },

    showNotification(message, type) {
      logisticsActions.addAlert({
        type: type,
        message: message
      })
    }
  },

  mounted() {
    // Initialisation
    this.refreshAllSections()
  }
}
</script>

<style scoped>
.flux-dock-sections {
  padding: 20px;
}

.flux-dock-header {
  margin-bottom: 30px;
  text-align: center;
}

.flux-dock-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.main-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin: 20px 0;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.global-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: bold;
  color: #2c3e50;
  border: 1px solid #e9ecef;
}

/* ===== STYLES DES SECTIONS ===== */

.section-container {
  margin-bottom: 30px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.in-progress-section {
  border-left: 6px solid #3498db;
}

.vrac-section {
  border-left: 6px solid #f39c12;
}

.palettized-section {
  border-left: 6px solid #9b59b6;
}

.done-section {
  border-left: 6px solid #27ae60;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 1.5rem;
}

.section-title h3 {
  margin: 0;
  color: #2c3e50;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-add {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  background: #219a52;
  transform: translateY(-1px);
}

.section-grid {
  background: #fafbfc;
}

.section-grid-component {
  height: 300px;
  width: 100%;
}

/* ===== STYLES DES CELLULES ===== */

:global(.move-cell-btn) {
  background: #3498db;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s ease;
}

:global(.move-cell-btn:hover) {
  background: #2980b9;
  transform: scale(1.05);
}

/* ===== MODAL DE DÉPLACEMENT ===== */

.move-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.move-modal {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 15px 15px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-weight: bold;
}

.modal-content {
  padding: 20px;
}

.current-status {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #3498db;
}

.move-options h4 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.move-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.move-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
  color: #2c3e50;
}

.move-btn:hover {
  border-color: #3498db;
  background: #ebf3fd;
}

.move-btn.in-progress {
  border-left: 4px solid #3498db;
}

.move-btn.vrac {
  border-left: 4px solid #f39c12;
}

.move-btn.palettized {
  border-left: 4px solid #9b59b6;
}

.move-btn.done {
  border-left: 4px solid #27ae60;
}

.move-btn small {
  color: #6c757d;
  font-style: italic;
}

.location-selection {
  margin: 20px 0;
}

.location-selection h4 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.location-dropdown {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
}

.validation-messages {
  margin: 15px 0;
}

.validation-message {
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 500;
}

.validation-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.validation-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 0 0 15px 15px;
}

.modal-actions .btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #219a52;
}

.btn-success:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

/* ===== RESPONSIVE ===== */

@media (max-width: 768px) {
  .main-toolbar {
    flex-direction: column;
    gap: 15px;
  }
  
  .global-stats {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .section-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .move-modal {
    width: 95%;
    margin: 10px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>