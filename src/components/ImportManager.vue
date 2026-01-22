<template>
  <div class="import-manager">
    <div class="import-header">
      <h2>📤 Gestionnaire d'Import/Export</h2>
      <p>Équivalent des fonctions VBA d'import/export Excel</p>
    </div>

    <!-- Barre d'outils -->
    <div class="import-toolbar">
      <div class="toolbar-section">
        <label class="file-input-label">
          <input 
            type="file" 
            ref="fileInput"
            @change="handleFileSelect"
            accept=".csv,.xlsx,.xls"
            multiple
          >
          📁 Sélectionner fichiers
        </label>
        
        <select v-model="selectedSource" class="source-select">
          <option value="">-- Choisir source --</option>
          <option value="AFT-SYSTEM">AFT System</option>
          <option value="FMC-SYSTEM">FMC System</option>
          <option value="SKYNET">Skynet Data</option>
          <option value="MANUAL">Saisie Manuelle</option>
        </select>
        
        <button 
          class="btn btn-success" 
          @click="processImport"
          :disabled="!selectedFiles.length || !selectedSource"
        >
          🚀 Lancer Import
        </button>
      </div>

      <div class="toolbar-section">
        <button class="btn btn-info" @click="exportCurrentData">
          📊 Export Excel
        </button>
        <button class="btn btn-warning" @click="validateAllData">
          ✅ Valider Données
        </button>
        <button class="btn" @click="clearImportHistory">
          🗑️ Vider Historique
        </button>
      </div>
    </div>

    <!-- Zone de prévisualisation -->
    <div v-if="previewData.length > 0" class="preview-section">
      <h3>👁️ Aperçu des données ({{ previewData.length }} lignes)</h3>
      
      <div class="preview-controls">
        <div class="validation-summary">
          <span class="valid-count">✅ {{ validationStats.valid }} valides</span>
          <span class="error-count">❌ {{ validationStats.errors }} erreurs</span>
          <span class="warning-count">⚠️ {{ validationStats.warnings }} avertissements</span>
        </div>
        
        <div class="preview-actions">
          <button class="btn btn-small" @click="showOnlyErrors = !showOnlyErrors">
            {{ showOnlyErrors ? 'Tout afficher' : 'Erreurs seules' }}
          </button>
          <button class="btn btn-small btn-success" @click="confirmImport" :disabled="validationStats.errors > 0">
            Confirmer Import
          </button>
          <button class="btn btn-small btn-danger" @click="cancelImport">
            Annuler
          </button>
        </div>
      </div>

      <!-- Table de prévisualisation -->
      <div class="preview-table-container">
        <table class="preview-table">
          <thead>
            <tr>
              <th>État</th>
              <th>VRID</th>
              <th>Statut</th>
              <th>Pallets</th>
              <th>BT</th>
              <th>Units</th>
              <th>SBD</th>
              <th>Location</th>
              <th>Erreurs</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(row, index) in displayedRows" 
              :key="index"
              :class="getRowClass(row)"
            >
              <td class="status-cell">
                <span v-if="row.validation.isValid" class="status-valid">✅</span>
                <span v-else-if="row.validation.errors.length > 0" class="status-error">❌</span>
                <span v-else class="status-warning">⚠️</span>
              </td>
              <td>{{ row.vrid }}</td>
              <td>{{ row.statut }}</td>
              <td>{{ row.pallets }}</td>
              <td>{{ row.bt }}</td>
              <td>{{ row.units?.toLocaleString() }}</td>
              <td>{{ formatDate(row.sbd) }}</td>
              <td>{{ row.location }}</td>
              <td class="errors-cell">
                <div v-if="row.validation.errors.length > 0" class="error-list">
                  <div v-for="error in row.validation.errors" :key="error" class="error-item">
                    {{ error }}
                  </div>
                </div>
                <div v-if="row.validation.warnings.length > 0" class="warning-list">
                  <div v-for="warning in row.validation.warnings" :key="warning" class="warning-item">
                    {{ warning }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modèles de données -->
    <div class="templates-section">
      <h3>📋 Modèles de Données</h3>
      
      <div class="templates-grid">
        <div class="template-card" v-for="template in dataTemplates" :key="template.name">
          <h4>{{ template.name }}</h4>
          <p>{{ template.description }}</p>
          <div class="template-fields">
            <span v-for="field in template.fields" :key="field" class="field-tag">
              {{ field }}
            </span>
          </div>
          <button class="btn btn-small" @click="downloadTemplate(template)">
            💾 Télécharger
          </button>
        </div>
      </div>
    </div>

    <!-- Historique des imports -->
    <div class="import-history">
      <h3>📜 Historique des Imports</h3>
      
      <div class="history-filters">
        <select v-model="historyFilter" class="filter-select">
          <option value="">Toutes les sources</option>
          <option value="AFT-SYSTEM">AFT System</option>
          <option value="FMC-SYSTEM">FMC System</option>
          <option value="SKYNET">Skynet Data</option>
        </select>
        
        <input 
          type="date" 
          v-model="historyDateFilter" 
          class="date-filter"
        >
      </div>

      <div class="history-list">
        <div 
          v-for="entry in filteredHistory" 
          :key="entry.id" 
          class="history-entry"
        >
          <div class="history-header">
            <span class="history-source">{{ entry.source }}</span>
            <span class="history-date">{{ formatDateTime(entry.timestamp) }}</span>
            <span :class="['history-status', entry.status]">{{ entry.status }}</span>
          </div>
          <div class="history-details">
            <span>📊 {{ entry.recordsProcessed }} enregistrements</span>
            <span v-if="entry.errors > 0">❌ {{ entry.errors }} erreurs</span>
            <span v-if="entry.duplicates > 0">🔄 {{ entry.duplicates }} doublons</span>
          </div>
          <div v-if="entry.message" class="history-message">
            {{ entry.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiques d'import -->
    <div class="import-stats">
      <h3>📈 Statistiques d'Import</h3>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ importStats.totalImports }}</div>
          <div class="stat-label">Imports Total</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ importStats.totalRecords }}</div>
          <div class="stat-label">Enregistrements</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ importStats.successRate }}%</div>
          <div class="stat-label">Taux de Réussite</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ importStats.averageTime }}s</div>
          <div class="stat-label">Temps Moyen</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { excelEmulator, excelSync, CONFIG_EXCEL } from '../stores/excelEmulator.js'
import logisticsStore, { logisticsActions } from '../stores/logisticsStore.js'

export default {
  name: 'ImportManager',
  data() {
    return {
      selectedFiles: [],
      selectedSource: '',
      previewData: [],
      showOnlyErrors: false,
      importHistory: JSON.parse(localStorage.getItem('importHistory') || '[]'),
      historyFilter: '',
      historyDateFilter: '',
      
      dataTemplates: [
        {
          name: 'AFT System Import',
          description: 'Modèle pour les données AFT avec validation complète',
          fields: ['VRID', 'Statut', 'Pallets', 'BT', 'Units', 'SBD', 'YMS_Arrival', 'Location'],
          headers: 'VRID,Statut,Pallets,BT,Units,SBD,YMS_Arrival,Location',
          example: 'AFT001,IN PROGRESS,5,2,150,2024-01-15 08:00:00,2024-01-15 07:30:00,QUAI_1'
        },
        {
          name: 'FMC System Import',
          description: 'Modèle pour les données FMC avec champs étendus',
          fields: ['VRID', 'Statut', 'Pallets', 'BT', 'Units', 'SBD', 'Location', 'Remorques', 'Priority'],
          headers: 'VRID,Statut,Pallets,BT,Units,SBD,Location,Remorques,Priority',
          example: 'FMC001,VRAC,3,1,120,2024-01-15 09:00:00,ZONE_VRAC,TR001,HIGH'
        },
        {
          name: 'Skynet Data Import',
          description: 'Modèle pour les données Skynet en temps réel',
          fields: ['VRID', 'Statut', 'Location', 'Timestamp', 'Units', 'Priority'],
          headers: 'VRID,Statut,Location,Timestamp,Units,Priority',
          example: 'SKY001,DONE,STOCK_A,2024-01-15 10:00:00,200,MEDIUM'
        }
      ]
    }
  },

  computed: {
    validationStats() {
      const stats = { valid: 0, errors: 0, warnings: 0 }
      
      this.previewData.forEach(row => {
        if (row.validation.isValid) {
          stats.valid++
        }
        if (row.validation.errors.length > 0) {
          stats.errors++
        }
        if (row.validation.warnings.length > 0) {
          stats.warnings++
        }
      })
      
      return stats
    },

    displayedRows() {
      if (this.showOnlyErrors) {
        return this.previewData.filter(row => !row.validation.isValid)
      }
      return this.previewData.slice(0, 50) // Limiter l'affichage
    },

    filteredHistory() {
      let filtered = this.importHistory

      if (this.historyFilter) {
        filtered = filtered.filter(entry => entry.source === this.historyFilter)
      }

      if (this.historyDateFilter) {
        const filterDate = new Date(this.historyDateFilter)
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.timestamp)
          return entryDate.toDateString() === filterDate.toDateString()
        })
      }

      return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    },

    importStats() {
      const history = this.importHistory
      const total = history.length
      const successful = history.filter(h => h.status === 'success').length
      const totalRecords = history.reduce((sum, h) => sum + h.recordsProcessed, 0)
      const totalTime = history.reduce((sum, h) => sum + (h.processingTime || 0), 0)

      return {
        totalImports: total,
        totalRecords: totalRecords,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
        averageTime: total > 0 ? Math.round(totalTime / total) : 0
      }
    }
  },

  methods: {
    handleFileSelect(event) {
      this.selectedFiles = Array.from(event.target.files)
    },

    async processImport() {
      const startTime = Date.now()
      
      try {
        for (const file of this.selectedFiles) {
          const content = await this.readFileContent(file)
          const parsedData = this.parseFileContent(content, file.name)
          const validatedData = this.validateImportData(parsedData)
          
          this.previewData = validatedData
        }
        
        this.showNotification('Fichiers traités pour aperçu', 'info')
      } catch (error) {
        this.showNotification(`Erreur de traitement: ${error.message}`, 'error')
        this.addToHistory({
          source: this.selectedSource,
          status: 'error',
          message: error.message,
          recordsProcessed: 0,
          errors: 1,
          processingTime: Date.now() - startTime
        })
      }
    },

    readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Erreur lecture fichier'))
        reader.readAsText(file)
      })
    },

    parseFileContent(content, filename) {
      // Détection du format basé sur l'extension
      const isCSV = filename.toLowerCase().endsWith('.csv')
      
      if (isCSV) {
        return this.parseCSVContent(content)
      } else {
        throw new Error('Format de fichier non supporté')
      }
    },

    parseCSVContent(content) {
      const lines = content.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        throw new Error('Fichier CSV vide ou invalide')
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const rows = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length !== headers.length) continue

        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })

        // Normalisation des données
        rows.push(this.normalizeRowData(row))
      }

      return rows
    },

    normalizeRowData(row) {
      return {
        vrid: row.vrid || row.id || '',
        statut: row.statut || row.status || 'IN PROGRESS',
        pallets: parseInt(row.pallets || row.pallet || 0),
        bt: parseInt(row.bt || 0),
        units: parseInt(row.units || row.unit || 0),
        sbd: this.parseDate(row.sbd || row.date),
        ymsArrivalTime: this.parseDate(row.yms_arrival || row.arrival || row.sbd),
        location: row.location || row.loc || 'QUEUE',
        remorques: row.remorques || row.trailer || '',
        priority: (row.priority || 'MEDIUM').toUpperCase(),
        fcSource: this.selectedSource,
        statutDetaille: row.statut_detaille || row.details || ''
      }
    },

    parseDate(dateStr) {
      if (!dateStr) return new Date()
      
      // Essayer différents formats de date
      const formats = [
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // 2024-01-15 08:00:00
        /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/, // 15/01/2024 08:00
        /^\d{4}-\d{2}-\d{2}$/, // 2024-01-15
        /^\d{2}\/\d{2}\/\d{4}$/ // 15/01/2024
      ]
      
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? new Date() : date
    },

    validateImportData(data) {
      return data.map(row => {
        const validation = this.validateRow(row)
        return {
          ...row,
          validation: validation
        }
      })
    },

    validateRow(row) {
      const errors = []
      const warnings = []

      // Validation VRID
      if (!row.vrid || row.vrid.length < 3) {
        errors.push('VRID manquant ou trop court')
      }

      // Vérifier si le VRID existe déjà
      const existingVRID = logisticsStore.store.vridData.find(v => v.vrid === row.vrid)
      if (existingVRID) {
        warnings.push('VRID déjà existant (sera mis à jour)')
      }

      // Validation des valeurs numériques
      if (row.pallets < 0) {
        errors.push('Nombre de palettes invalide')
      }
      if (row.bt < 0) {
        errors.push('Nombre de BT invalide')
      }
      if (row.units < 0) {
        errors.push('Nombre d\'unités invalide')
      }

      // Validation du statut
      const validStatuses = ['IN PROGRESS', 'VRAC', 'PALETTIZED', 'DONE']
      if (!validStatuses.includes(row.statut)) {
        errors.push('Statut invalide')
      }

      // Validation de la priorité
      if (!['HIGH', 'MEDIUM', 'LOW'].includes(row.priority)) {
        errors.push('Priorité invalide')
      }

      // Validation de l'emplacement
      if (!excelEmulator.validation.validateLocation(row.location, row.statut)) {
        warnings.push('Emplacement non optimal pour ce statut')
      }

      // Validation des dates
      if (isNaN(row.sbd.getTime())) {
        errors.push('Date SBD invalide')
      }

      return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
      }
    },

    async confirmImport() {
      const startTime = Date.now()
      let successCount = 0
      let errorCount = 0
      let duplicateCount = 0

      try {
        for (const row of this.previewData) {
          if (row.validation.isValid) {
            const existingIndex = logisticsStore.store.vridData.findIndex(v => v.vrid === row.vrid)
            
            const vridData = {
              id: existingIndex >= 0 ? logisticsStore.store.vridData[existingIndex].id : Date.now() + Math.random(),
              vrid: row.vrid,
              statut: row.statut,
              pallets: row.pallets,
              bt: row.bt,
              units: row.units,
              sbd: row.sbd,
              ymsArrivalTime: row.ymsArrivalTime,
              location: row.location,
              remorques: row.remorques,
              priority: row.priority,
              fcSource: row.fcSource,
              statutDetaille: row.statutDetaille,
              createdAt: existingIndex >= 0 ? logisticsStore.store.vridData[existingIndex].createdAt : new Date(),
              updatedAt: new Date()
            }

            if (existingIndex >= 0) {
              logisticsStore.store.vridData[existingIndex] = vridData
              duplicateCount++
            } else {
              logisticsStore.store.vridData.push(vridData)
            }
            
            successCount++
          } else {
            errorCount++
          }
        }

        // Mettre à jour les métriques
        logisticsActions.updateMetrics()
        logisticsActions.updateBacklog()

        // Ajouter à l'historique
        this.addToHistory({
          source: this.selectedSource,
          status: 'success',
          message: `Import réussi: ${successCount} enregistrements traités`,
          recordsProcessed: successCount,
          errors: errorCount,
          duplicates: duplicateCount,
          processingTime: Date.now() - startTime
        })

        this.showNotification(`Import terminé: ${successCount} enregistrements traités`, 'success')
        this.cancelImport()

      } catch (error) {
        this.addToHistory({
          source: this.selectedSource,
          status: 'error',
          message: error.message,
          recordsProcessed: successCount,
          errors: errorCount + 1,
          processingTime: Date.now() - startTime
        })

        this.showNotification(`Erreur lors de l'import: ${error.message}`, 'error')
      }
    },

    cancelImport() {
      this.previewData = []
      this.selectedFiles = []
      this.selectedSource = ''
      this.$refs.fileInput.value = ''
    },

    exportCurrentData() {
      try {
        excelEmulator.macros.exportToExcel()
        this.showNotification('Export Excel terminé', 'success')
      } catch (error) {
        this.showNotification(`Erreur export: ${error.message}`, 'error')
      }
    },

    validateAllData() {
      const startTime = Date.now()
      let validCount = 0
      let errorCount = 0

      logisticsStore.store.vridData.forEach(vrid => {
        const validation = excelEmulator.validation.validateVRID(vrid)
        if (validation.isValid) {
          validCount++
        } else {
          errorCount++
        }
      })

      this.addToHistory({
        source: 'VALIDATION',
        status: errorCount === 0 ? 'success' : 'warning',
        message: `Validation: ${validCount} valides, ${errorCount} erreurs`,
        recordsProcessed: validCount + errorCount,
        errors: errorCount,
        processingTime: Date.now() - startTime
      })

      this.showNotification(`Validation terminée: ${validCount} valides, ${errorCount} erreurs`, 
                          errorCount === 0 ? 'success' : 'warning')
    },

    downloadTemplate(template) {
      const content = template.headers + '\n' + template.example
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `template_${template.name.toLowerCase().replace(/\s+/g, '_')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    addToHistory(entry) {
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date(),
        ...entry
      }
      
      this.importHistory.unshift(historyEntry)
      
      // Garder seulement les 100 dernières entrées
      if (this.importHistory.length > 100) {
        this.importHistory = this.importHistory.slice(0, 100)
      }
      
      localStorage.setItem('importHistory', JSON.stringify(this.importHistory))
    },

    clearImportHistory() {
      this.importHistory = []
      localStorage.removeItem('importHistory')
      this.showNotification('Historique vidé', 'info')
    },

    getRowClass(row) {
      if (!row.validation.isValid) return 'row-error'
      if (row.validation.warnings.length > 0) return 'row-warning'
      return 'row-valid'
    },

    formatDate(date) {
      return date.toLocaleString('fr-FR')
    },

    formatDateTime(date) {
      return new Date(date).toLocaleString('fr-FR')
    },

    showNotification(message, type) {
      logisticsActions.addAlert({
        type: type,
        message: message
      })
    }
  },

  mounted() {
    // Initialiser la synchronisation Excel
    excelSync.init()
  }
}
</script>

<style scoped>
.import-manager {
  padding: 20px;
}

.import-header {
  text-align: center;
  margin-bottom: 30px;
}

.import-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.import-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  flex-wrap: wrap;
  gap: 15px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.file-input-label {
  background: #3498db;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
}

.file-input-label:hover {
  background: #2980b9;
}

.file-input-label input {
  display: none;
}

.source-select, .filter-select, .date-filter {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 5px;
  background: white;
}

.preview-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.validation-summary {
  display: flex;
  gap: 20px;
}

.valid-count {
  color: #27ae60;
  font-weight: bold;
}

.error-count {
  color: #e74c3c;
  font-weight: bold;
}

.warning-count {
  color: #f39c12;
  font-weight: bold;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.preview-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ecf0f1;
  border-radius: 5px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
}

.status-cell {
  text-align: center;
  width: 60px;
}

.errors-cell {
  max-width: 200px;
}

.error-list, .warning-list {
  font-size: 0.9em;
}

.error-item {
  color: #e74c3c;
  margin-bottom: 5px;
}

.warning-item {
  color: #f39c12;
  margin-bottom: 5px;
}

.row-valid {
  background: #f8fff8;
}

.row-warning {
  background: #fffaf0;
}

.row-error {
  background: #fff5f5;
}

.templates-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.template-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.template-card h4 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.template-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 15px 0;
}

.field-tag {
  background: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.import-history {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.history-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-entry {
  background: #f8f9fa;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  border-left: 4px solid #3498db;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 10px;
}

.history-source {
  font-weight: bold;
  color: #2c3e50;
}

.history-date {
  color:  #7f8c8d;
  font-size: 0.9rem;
}

.history-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.history-status.success {
  background: #d4edda;
  color: #155724;
}

.history-status.error {
  background: #f8d7da;
  color: #721c24;
}

.history-status.warning {
  background: #fff3cd;
  color: #856404;
}

.history-details {
  display: flex;
  gap: 15px;
  color: #6c757d;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.history-message {
  margin-top: 10px;
  font-style: italic;
  color: #495057;
}

.import-stats {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
}

.stat-label {
  color: #6c757d;
  font-weight: bold;
}

@media (max-width: 768px) {
  .import-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-section {
    justify-content: center;
  }
  
  .preview-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .validation-summary {
    justify-content: center;
  }
  
  .templates-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>