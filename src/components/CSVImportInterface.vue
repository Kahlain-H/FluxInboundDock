<template>
  <div class="csv-import-interface">
    <!-- En-tête avec sélection du type d'import -->
    <div class="import-header">
      <h2>📤 Import CSV - Reproduction VBA</h2>
      <p>Reproduction fidèle des fonctions ImportCSVToAFTV3, VRID_FMC_du_jourV3 et VRID_FMC_du_jourV4</p>
      
      <div class="import-type-selector">
        <div class="import-option" 
             :class="{ active: selectedImportType === 'AFT' }"
             @click="selectImportType('AFT')">
          <div class="option-icon">📊</div>
          <div class="option-content">
            <h3>Import AFT</h3>
            <p>ImportCSVToAFTV3</p>
            <small>Nettoyage auto + tableau formaté</small>
          </div>
        </div>
        
        <div class="import-option" 
             :class="{ active: selectedImportType === 'FMC_V3' }"
             @click="selectImportType('FMC_V3')">
          <div class="option-icon">🚚</div>
          <div class="option-content">
            <h3>Import FMC V3</h3>
            <p>VRID_FMC_du_jourV3</p>
            <small>Lecture ligne par ligne + formatage</small>
          </div>
        </div>
        
        <div v-if="showV4Option" class="import-option" 
             :class="{ active: selectedImportType === 'FMC_V4' }"
             @click="selectImportType('FMC_V4')">
          <div class="option-icon">📋</div>
          <div class="option-content">
            <h3>Import FMC V4</h3>
            <p>VRID_FMC_du_jourV4</p>
            <small>VRID du jour → Colonne J Dashboard</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Zone de sélection de fichier -->
    <div class="file-selection-area" v-if="selectedImportType">
      <div class="file-dropzone" 
           :class="{ 'dragover': isDragging, 'has-file': selectedFile }"
           @drop="handleDrop"
           @dragover="handleDragOver"
           @dragenter="handleDragEnter"
           @dragleave="handleDragLeave">
        
        <div v-if="!selectedFile" class="dropzone-content">
          <div class="dropzone-icon">📁</div>
          <h3>Sélectionner le fichier CSV</h3>
          <p>Glissez-déposez votre fichier {{ getCurrentConfig().name }} ici</p>
          <p><strong>ou</strong></p>
          <label class="file-button">
            <input type="file" 
                   ref="fileInput"
                   @change="handleFileSelect"
                   accept=".csv"
                   :disabled="isImporting">
            Parcourir les fichiers
          </label>
        </div>
        
        <div v-else class="file-selected">
          <div class="file-info">
            <div class="file-icon">📄</div>
            <div class="file-details">
              <h4>{{ selectedFile.name }}</h4>
              <p>{{ formatFileSize(selectedFile.size) }} • {{ formatDate(selectedFile.lastModified) }}</p>
            </div>
            <button class="remove-file" @click="removeFile">✕</button>
          </div>
          
          <div class="file-actions">
            <button class="btn btn-success" 
                    @click="startImport"
                    :disabled="isImporting">
              <span v-if="!isImporting">🚀 Lancer {{ getCurrentConfig().name }}</span>
              <span v-else>⏳ Import en cours...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Configuration de l'import sélectionné -->
      <div class="import-config-display">
        <h3>📋 Configuration {{ getCurrentConfig().name }}</h3>
        <div class="config-details">
          <div class="config-item">
            <strong>Feuille cible:</strong> {{ getCurrentConfig().sheetName }}
          </div>
          <div class="config-item" v-if="getCurrentConfig().cleanBeforeImport">
            <strong>Nettoyage:</strong> ✅ Automatique avant import
          </div>
          <div class="config-item" v-if="getCurrentConfig().readLineByLine">
            <strong>Lecture:</strong> 📖 Ligne par ligne (mode V3)
          </div>
          <div class="config-item" v-if="getCurrentConfig().targetColumn">
            <strong>Destination:</strong> Colonne {{ getCurrentConfig().targetColumn }} du Dashboard
          </div>
          <div class="config-item">
            <strong>Colonnes attendues:</strong> 
            <span class="expected-columns">
              <span v-for="col in getCurrentConfig().expectedColumns" :key="col" class="column-tag">
                {{ col }}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Barre de progression -->
    <div v-if="isImporting" class="import-progress">
      <div class="progress-header">
        <h3>🔄 {{ getCurrentConfig().name }} en cours...</h3>
        <span class="progress-step">{{ currentStep }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-details">
        <div v-for="step in importSteps" :key="step.name" 
             :class="['step-item', step.status]">
          <span class="step-icon">
            {{ step.status === 'completed' ? '✅' : 
               step.status === 'active' ? '⏳' : '⏸️' }}
          </span>
          <span class="step-name">{{ step.name }}</span>
        </div>
      </div>
    </div>

    <!-- Aperçu des données importées -->
    <div v-if="previewData.length > 0" class="import-preview">
      <div class="preview-header">
        <h3>👁️ Aperçu des données ({{ previewData.length }} lignes)</h3>
        <div class="preview-stats">
          <span class="stat valid">✅ {{ validRecords }} valides</span>
          <span class="stat errors" v-if="errorRecords > 0">❌ {{ errorRecords }} erreurs</span>
          <span class="stat warnings" v-if="warningRecords > 0">⚠️ {{ warningRecords }} avertissements</span>
        </div>
      </div>

      <div class="preview-table-container">
        <table class="preview-table">
          <thead>
            <tr>
              <th>État</th>
              <th v-for="col in previewColumns" :key="col">{{ col }}</th>
              <th>Validation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in limitedPreview" 
                :key="index"
                :class="getRowValidationClass(row)">
              <td class="status-cell">
                <span v-if="row.validation?.isValid" class="status-valid">✅</span>
                <span v-else class="status-error">❌</span>
              </td>
              <td v-for="col in previewColumns" :key="col">
                {{ formatCellValue(row[col.toLowerCase()]) }}
              </td>
              <td class="validation-cell">
                <div v-if="row.validation?.errors?.length" class="validation-errors">
                  <div v-for="error in row.validation.errors" :key="error" class="error-text">
                    {{ error }}
                  </div>
                </div>
                <div v-if="row.validation?.warnings?.length" class="validation-warnings">
                  <div v-for="warning in row.validation.warnings" :key="warning" class="warning-text">
                    {{ warning }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="previewData.length > 10" class="preview-pagination">
          <p>Affichage de 10 sur {{ previewData.length }} lignes</p>
          <button class="btn btn-small" @click="showAllPreview = !showAllPreview">
            {{ showAllPreview ? 'Réduire' : 'Voir tout' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Résultats de l'import -->
    <div v-if="importResults" class="import-results">
      <div class="results-header" :class="importResults.success ? 'success' : 'error'">
        <div class="result-icon">
          {{ importResults.success ? '🎉' : '❌' }}
        </div>
        <div class="result-content">
          <h3>{{ importResults.success ? 'Import Réussi!' : 'Erreur d\'Import' }}</h3>
          <p>{{ importResults.message }}</p>
        </div>
      </div>

      <div class="results-details" v-if="importResults.success">
        <div class="detail-card">
          <div class="detail-value">{{ importResults.records }}</div>
          <div class="detail-label">Enregistrements traités</div>
        </div>
        
        <div class="detail-card" v-if="importResults.dashboardUpdated">
          <div class="detail-value">✅</div>
          <div class="detail-label">Dashboard mis à jour</div>
        </div>
        
        <div class="detail-card" v-if="importResults.processingTime">
          <div class="detail-value">{{ Math.round(importResults.processingTime / 1000) }}s</div>
          <div class="detail-label">Temps de traitement</div>
        </div>
      </div>

      <div class="results-actions">
        <button class="btn btn-success" @click="viewUpdatedData">
          👁️ Voir les Données Mises à Jour
        </button>
        <button class="btn" @click="resetImport">
          🔄 Nouvel Import
        </button>
      </div>
    </div>

    <!-- Historique des imports -->
    <div class="import-history-section">
      <h3>📜 Historique des Imports VBA</h3>
      
      <div class="history-filters">
        <select v-model="historyFilter" class="filter-select">
          <option value="">Tous les types</option>
          <option value="AFT">Import AFT</option>
          <option value="FMC_V3">Import FMC V3</option>
          <option value="FMC_V4">Import FMC V4</option>
        </select>
        
        <input type="date" v-model="dateFilter" class="date-filter">
      </div>

      <div class="history-list">
        <div v-for="entry in filteredHistory" 
             :key="entry.id" 
             class="history-entry"
             :class="entry.status">
          
          <div class="history-header">
            <div class="history-type">
              <span class="type-icon">
                {{ entry.type === 'AFT' ? '📊' : 
                   entry.type === 'FMC_V3' ? '🚚' : '📋' }}
              </span>
              <span class="type-name">{{ getImportTypeName(entry.type) }}</span>
            </div>
            <div class="history-time">{{ formatDateTime(entry.timestamp) }}</div>
          </div>
          
          <div class="history-details">
            <span class="record-count">📦 {{ entry.recordsProcessed }} enregistrements</span>
            <span class="processing-time">⏱️ {{ Math.round((entry.processingTime || 0) / 1000) }}s</span>
            <span class="status-badge" :class="entry.status">{{ entry.status.toUpperCase() }}</span>
          </div>
          
          <div v-if="entry.error" class="history-error">
            ❌ {{ entry.error }}
          </div>
          
          <div v-if="entry.specificInfo" class="history-specific">
            ℹ️ {{ entry.specificInfo }}
          </div>
        </div>
      </div>
    </div>

    <!-- États des imports -->
    <div class="import-states-overview">
      <h3>📊 État des Imports</h3>
      
      <div class="states-grid">
        <div v-for="(state, type) in importStates" 
             :key="type" 
             class="state-card"
             :class="{ active: state.isImporting }">
          <div class="state-header">
            <span class="state-icon">
              {{ type === 'AFT' ? '📊' : 
                 type === 'FMC_V3' ? '🚚' : '📋' }}
            </span>
            <h4>{{ getImportTypeName(type) }}</h4>
          </div>
          
          <div class="state-details">
            <div class="state-item">
              <span class="label">Statut:</span>
              <span class="value" :class="{ importing: state.isImporting }">
                {{ state.isImporting ? '🔄 En cours' : '⏸️ Inactif' }}
              </span>
            </div>
            
            <div class="state-item" v-if="state.lastImport">
              <span class="label">Dernier import:</span>
              <span class="value">{{ formatDateTime(state.lastImport) }}</span>
            </div>
            
            <div class="state-item">
              <span class="label">Enregistrements:</span>
              <span class="value">{{ state.recordCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { importStore, importActions, IMPORT_CONFIG } from '../stores/csvImportManager.js'

export default {
  name: 'CSVImportInterface',
  
  props: {
    defaultImportType: {
      type: String,
      default: ''
    },
    restrictedToType: {
      type: Boolean,
      default: false
    },
    showV4Option: {
      type: Boolean,
      default: false
    }
  },
  
  setup(props) {
    // États réactifs
    const selectedImportType = ref(props.defaultImportType || '')
    const selectedFile = ref(null)
    const isDragging = ref(false)
    const isImporting = ref(false)
    const progress = ref(0)
    const currentStep = ref('')
    const previewData = ref([])
    const importResults = ref(null)
    const showAllPreview = ref(false)
    const historyFilter = ref('')
    const dateFilter = ref('')

    // Étapes de l'import
    const importSteps = ref([
      { name: 'Nettoyage de la feuille', status: 'pending' },
      { name: 'Lecture du fichier CSV', status: 'pending' },
      { name: 'Parsing des données', status: 'pending' },
      { name: 'Validation des données', status: 'pending' },
      { name: 'Mise à jour des données principales', status: 'pending' },
      { name: 'Synchronisation', status: 'pending' }
    ])

    // Computed properties
    const getCurrentConfig = () => {
      return IMPORT_CONFIG[selectedImportType.value] || {}
    }

    const previewColumns = computed(() => {
      const config = getCurrentConfig()
      return config.expectedColumns || []
    })

    const limitedPreview = computed(() => {
      return showAllPreview.value ? previewData.value : previewData.value.slice(0, 10)
    })

    const validRecords = computed(() => {
      return previewData.value.filter(row => row.validation?.isValid).length
    })

    const errorRecords = computed(() => {
      return previewData.value.filter(row => row.validation?.errors?.length > 0).length
    })

    const warningRecords = computed(() => {
      return previewData.value.filter(row => row.validation?.warnings?.length > 0).length
    })

    const filteredHistory = computed(() => {
      let history = importStore.importHistory

      if (historyFilter.value) {
        history = history.filter(entry => entry.type === historyFilter.value)
      }

      if (dateFilter.value) {
        const filterDate = new Date(dateFilter.value)
        history = history.filter(entry => {
          const entryDate = new Date(entry.timestamp)
          return entryDate.toDateString() === filterDate.toDateString()
        })
      }

      return history.slice(0, 20) // Limiter à 20 entrées
    })

    const importStates = computed(() => importStore.importStates)

    // Méthodes
    const selectImportType = (type) => {
      selectedImportType.value = type
      resetImport()
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file && file.type === 'text/csv') {
        selectedFile.value = file
      } else {
        alert('Veuillez sélectionner un fichier CSV valide')
      }
    }

    const handleDrop = (event) => {
      event.preventDefault()
      isDragging.value = false
      
      const files = event.dataTransfer.files
      if (files.length > 0 && files[0].type === 'text/csv') {
        selectedFile.value = files[0]
      }
    }

    const handleDragOver = (event) => {
      event.preventDefault()
    }

    const handleDragEnter = () => {
      isDragging.value = true
    }

    const handleDragLeave = () => {
      isDragging.value = false
    }

    const removeFile = () => {
      selectedFile.value = null
      previewData.value = []
      importResults.value = null
    }

    const updateProgress = (step, stepIndex) => {
      currentStep.value = step
      progress.value = ((stepIndex + 1) / importSteps.value.length) * 100
      
      // Mettre à jour le statut des étapes
      importSteps.value.forEach((s, index) => {
        if (index < stepIndex) {
          s.status = 'completed'
        } else if (index === stepIndex) {
          s.status = 'active'
        } else {
          s.status = 'pending'
        }
      })
    }

    const startImport = async () => {
      if (!selectedFile.value) return

      isImporting.value = true
      importResults.value = null
      
      try {
        const importType = selectedImportType.value

        // Exécution avec suivi des étapes
        updateProgress('Initialisation...', 0)
        await new Promise(resolve => setTimeout(resolve, 500))

        let result
        switch (importType) {
          case 'AFT':
            updateProgress('Nettoyage feuille AFT...', 0)
            await new Promise(resolve => setTimeout(resolve, 300))
            
            updateProgress('Lecture du CSV...', 1)
            await new Promise(resolve => setTimeout(resolve, 500))
            
            updateProgress('Création tableau formaté...', 2)
            result = await importActions.importAFTData(selectedFile.value)
            break
            
          case 'FMC_V3':
            updateProgress('Nettoyage complet feuille FMC...', 0)
            await new Promise(resolve => setTimeout(resolve, 300))
            
            updateProgress('Lecture ligne par ligne...', 1)
            await new Promise(resolve => setTimeout(resolve, 700))
            
            updateProgress('Formatage des données...', 2)
            result = await importActions.importFMCV3Data(selectedFile.value)
            break
            
          case 'FMC_V4':
            updateProgress('Parsing VRID du jour...', 1)
            await new Promise(resolve => setTimeout(resolve, 400))
            
            updateProgress('Copie vers colonne J Dashboard...', 3)
            await new Promise(resolve => setTimeout(resolve, 300))
            
            result = await importActions.importFMCV4Data(selectedFile.value)
            break
        }

        updateProgress('Validation terminée...', 3)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        updateProgress('Mise à jour données principales...', 4)
        await new Promise(resolve => setTimeout(resolve, 400))
        
        updateProgress('Synchronisation finale...', 5)
        await importActions.synchronizeAfterImport(importType)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Résultats finaux
        importResults.value = {
          success: true,
          message: `Import ${getCurrentConfig().name} terminé avec succès`,
          records: result.records,
          dashboardUpdated: result.dashboardUpdated || false,
          processingTime: Date.now()
        }

        // Aperçu des données
        switch (importType) {
          case 'AFT':
            previewData.value = importStore.aftData.slice(0, 50)
            break
          case 'FMC_V3':
            previewData.value = importStore.fmcData.slice(0, 50)
            break
          case 'FMC_V4':
            previewData.value = importStore.dashboardVRIDs.slice(0, 50)
            break
        }

      } catch (error) {
        importResults.value = {
          success: false,
          message: `Erreur lors de l'import: ${error.message}`,
          error: error.message
        }
      } finally {
        isImporting.value = false
        progress.value = 100
        currentStep.value = 'Terminé'
      }
    }

    const resetImport = () => {
      selectedFile.value = null
      isImporting.value = false
      progress.value = 0
      currentStep.value = ''
      previewData.value = []
      importResults.value = null
      showAllPreview.value = false
      
      // Reset des étapes
      importSteps.value.forEach(step => {
        step.status = 'pending'
      })
    }

    const viewUpdatedData = () => {
      // Navigation vers l'onglet approprié
      this.$emit('navigate-to-tab', selectedImportType.value === 'FMC_V4' ? 'dashboard' : 'flux-dock')
    }

    // Fonctions utilitaires
    const formatFileSize = (bytes) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      if (bytes === 0) return '0 Bytes'
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString('fr-FR')
    }

    const formatDateTime = (date) => {
      return new Date(date).toLocaleString('fr-FR')
    }

    const formatCellValue = (value) => {
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') return value.toLocaleString()
      if (value instanceof Date) return value.toLocaleDateString('fr-FR')
      return String(value)
    }

    const getRowValidationClass = (row) => {
      if (!row.validation) return ''
      if (!row.validation.isValid) return 'row-error'
      if (row.validation.warnings?.length > 0) return 'row-warning'
      return 'row-valid'
    }

    const getImportTypeName = (type) => {
      const names = {
        'AFT': 'ImportCSVToAFTV3',
        'FMC_V3': 'VRID_FMC_du_jourV3',
        'FMC_V4': 'VRID_FMC_du_jourV4'
      }
      return names[type] || type
    }

    return {
      selectedImportType,
      selectedFile,
      isDragging,
      isImporting,
      progress,
      currentStep,
      previewData,
      importResults,
      showAllPreview,
      historyFilter,
      dateFilter,
      importSteps,
      getCurrentConfig,
      previewColumns,
      limitedPreview,
      validRecords,
      errorRecords,
      warningRecords,
      filteredHistory,
      importStates,
      selectImportType,
      handleFileSelect,
      handleDrop,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      removeFile,
      startImport,
      resetImport,
      viewUpdatedData,
      formatFileSize,
      formatDate,
      formatDateTime,
      formatCellValue,
      getRowValidationClass,
      getImportTypeName
    }
  }
}
</script>

<style scoped>
.csv-import-interface {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.import-header {
  text-align: center;
  margin-bottom: 30px;
}

.import-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.import-type-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.import-option {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
}

.import-option:hover {
  border-color: #3498db;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.import-option.active {
  border-color: #3498db;
  background: #f8fcff;
}

.option-icon {
  font-size: 2rem;
}

.option-content h3 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.option-content p {
  margin: 0 0 5px 0;
  font-weight: bold;
  color: #3498db;
}

.option-content small {
  color: #6c757d;
}

.file-selection-area {
  margin: 30px 0;
}

.file-dropzone {
  border: 3px dashed #bdc3c7;
  border-radius: 15px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.file-dropzone.dragover {
  border-color: #3498db;
  background: #f0f8ff;
}

.file-dropzone.has-file {
  border-color: #27ae60;
  background: #f0fff4;
}

.dropzone-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.file-button {
  background: #3498db;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-block;
  font-weight: bold;
  transition: background 0.3s ease;
}

.file-button:hover {
  background: #2980b9;
}

.file-button input {
  display: none;
}

.file-selected {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.file-icon {
  font-size: 2rem;
}

.file-details {
  flex: 1;
}

.file-details h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.file-details p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.remove-file {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-weight: bold;
}

.import-config-display {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid #e9ecef;
}

.config-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expected-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.column-tag {
  background: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.import-progress {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #ecf0f1;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.5s ease;
}

.progress-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
}

.step-item.completed {
  background: #d4edda;
}

.step-item.active {
  background: #fff3cd;
}

.step-item.pending {
  background: #f8f9fa;
}

.import-preview {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.preview-stats {
  display: flex;
  gap: 15px;
}

.stat {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: bold;
}

.stat.valid {
  background: #d4edda;
  color: #155724;
}

.stat.errors {
  background: #f8d7da;
  color: #721c24;
}

.stat.warnings {
  background: #fff3cd;
  color: #856404;
}

.preview-table-container {
  max-height: 400px;
  overflow: auto;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
}

.status-cell,
.validation-cell {
  width: 80px;
  text-align: center;
}

.row-valid {
  background: #f8fff8;
}

.row-warning {
  background: #fffbf0;
}

.row-error {
  background: #fff5f5;
}

.validation-errors .error-text {
  color: #e74c3c;
  font-size: 0.8rem;
}

.validation-warnings .warning-text {
  color: #f39c12;
  font-size: 0.8rem;
}

.import-results {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.results-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
}

.results-header.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.results-header.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.result-icon {
  font-size: 2rem;
}

.results-details {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.detail-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  flex: 1;
}

.detail-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.detail-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.import-history-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.history-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.filter-select,
.date-filter {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-entry {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  border-left: 4px solid #6c757d;
}

.history-entry.success {
  border-left-color: #28a745;
}

.history-entry.error {
  border-left-color: #dc3545;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 1.2rem;
}

.type-name {
  font-weight: bold;
  color: #2c3e50;
}

.history-time {
  color: #6c757d;
  font-size: 0.9rem;
}

.history-details {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
}

.status-badge.error {
  background: #f8d7da;
  color: #721c24;
}

.import-states-overview {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.states-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.state-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.state-card.active {
  border-color: #3498db;
  background: #f0f8ff;
}

.state-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.state-icon {
  font-size: 1.5rem;
}

.state-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state-item {
  display: flex;
  justify-content: space-between;
}

.value.importing {
  color: #3498db;
  font-weight: bold;
}

@media (max-width: 768px) {
  .import-type-selector {
    grid-template-columns: 1fr;
  }
  
  .results-details {
    flex-direction: column;
  }
  
  .history-filters {
    flex-direction: column;
  }
  
  .states-grid {
    grid-template-columns: 1fr;
  }
}
</style>