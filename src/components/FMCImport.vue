<template>
  <div class="fmc-import-container">
    <!-- Interface d'import CSV spécialisée FMC -->
    <CSVImportInterface
      :default-import-type="'FMC_V3'"
      :show-v4-option="true"
      @navigate-to-tab="$emit('navigate-to-tab', $event)"
    />
    
    <div class="import-header">
      <h2>📄 Import FMC - VRID_FMC_du_jourV3 / V4</h2>
      <p>Reproduction des fonctions VBA V3 (lecture ligne par ligne) et V4 (VRID du jour → Dashboard)</p>
    </div>

    <!-- Zone de dépôt de fichier -->
    <div class="file-drop-zone" 
         :class="{ 'dragover': isDragOver }"
         @drop="handleDrop"
         @dragover="handleDragOver"
         @dragleave="handleDragLeave">
      <div class="drop-content">
        <div class="drop-icon">📄</div>
        <h3>Glissez votre fichier CSV FMC ici</h3>
        <p>ou</p>
        <button class="btn btn-primary" @click="selectFile">
          Choisir un fichier
        </button>
        <input 
          ref="fileInput" 
          type="file" 
          accept=".csv" 
          @change="handleFileSelect" 
          style="display: none;"
        />
      </div>
    </div>

    <!-- Templates prédéfinis -->
    <div class="templates-section">
      <h3>📋 Templates FMC</h3>
      <div class="templates-grid">
        <div class="template-card" @click="loadTemplate('standard')">
          <div class="template-icon">📊</div>
          <h4>Standard FMC</h4>
          <p>Format standard avec VRID, location, palettes</p>
        </div>
        <div class="template-card" @click="loadTemplate('extended')">
          <div class="template-icon">📈</div>
          <h4>FMC Étendu</h4>
          <p>Format avec informations détaillées et tracking</p>
        </div>
        <div class="template-card" @click="loadTemplate('custom')">
          <div class="template-icon">⚙️</div>
          <h4>Personnalisé</h4>
          <p>Configurez votre propre mapping</p>
        </div>
      </div>
    </div>

    <!-- Aperçu du fichier -->
    <div v-if="fileData" class="file-preview">
      <div class="preview-header">
        <h3>📋 Aperçu: {{ fileName }}</h3>
        <div class="file-info">
          <span>{{ fileData.length }} lignes • Template: {{ selectedTemplate }}</span>
          <button class="btn btn-success" @click="importData" :disabled="isImporting">
            {{ isImporting ? 'Import en cours...' : '✅ Importer les données FMC' }}
          </button>
        </div>
      </div>
      
      <!-- Tableau d'aperçu -->
      <div class="preview-table">
        <ag-grid-vue
          class="ag-theme-alpine"
          :columnDefs="previewColumns"
          :rowData="previewData"
          :defaultColDef="defaultColDef"
          :gridOptions="previewGridOptions">
        </ag-grid-vue>
      </div>
    </div>

    <!-- Validation des données -->
    <div v-if="validationResults.length > 0" class="validation-section">
      <h3>⚠️ Validation des données</h3>
      <div class="validation-list">
        <div v-for="result in validationResults" :key="result.id" 
             :class="['validation-item', result.type]">
          <div class="validation-icon">
            {{ result.type === 'error' ? '❌' : result.type === 'warning' ? '⚠️' : 'ℹ️' }}
          </div>
          <div class="validation-content">
            <strong>Ligne {{ result.line }}:</strong>
            {{ result.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiques FMC -->
    <div class="fmc-stats">
      <h3>📊 Statistiques FMC du jour</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🚛</div>
          <div class="stat-content">
            <h4>{{ fmcStats.totalVRID }}</h4>
            <p>VRID traités</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <h4>{{ fmcStats.totalPallets }}</h4>
            <p>Palettes gérées</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <h4>{{ fmcStats.avgProcessTime }}min</h4>
            <p>Temps moyen</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <h4>{{ fmcStats.successRate }}%</h4>
            <p>Taux de réussite</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration avancée -->
    <div class="advanced-config">
      <h3>⚙️ Configuration Avancée</h3>
      <div class="config-options">
        <div class="config-item">
          <label>
            <input type="checkbox" v-model="config.validateVRID"> 
            Valider les VRID existants
          </label>
        </div>
        <div class="config-item">
          <label>
            <input type="checkbox" v-model="config.autoAssignLocation"> 
            Attribution automatique des locations
          </label>
        </div>
        <div class="config-item">
          <label>
            <input type="checkbox" v-model="config.notifyOnError"> 
            Notifications en cas d'erreur
          </label>
        </div>
        <div class="config-item">
          <label>
            <input type="checkbox" v-model="config.backup"> 
            Sauvegarde avant import
          </label>
        </div>
      </div>
    </div>

    <!-- Historique des imports FMC -->
    <div class="import-history">
      <h3>📜 Historique des imports FMC</h3>
      <div class="history-list">
        <div v-for="entry in importHistory" :key="entry.id" class="history-item fmc">
          <div class="history-info">
            <strong>{{ entry.fileName }}</strong>
            <span class="history-date">{{ formatDate(entry.date) }}</span>
            <span class="history-template">Template: {{ entry.template }}</span>
          </div>
          <div class="history-stats">
            <span class="success-count">✅ {{ entry.successCount }}</span>
            <span class="warning-count" v-if="entry.warningCount > 0">⚠️ {{ entry.warningCount }}</span>
            <span class="error-count" v-if="entry.errorCount > 0">❌ {{ entry.errorCount }}</span>
          </div>
          <div class="history-actions">
            <button class="btn-small" @click="downloadLog(entry)">📄 Rapport</button>
            <button class="btn-small" @click="reimport(entry)">🔄 Re-importer</button>
            <button class="btn-small" @click="exportTemplate(entry)">💾 Template</button>
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
import CSVImportInterface from './CSVImportInterface.vue'

export default {
  name: 'FMCImport',
  components: {
    AgGridVue,
    CSVImportInterface
  },
  emits: ['navigate-to-tab'],
  data() {
    return {
      isDragOver: false,
      fileData: null,
      fileName: '',
      selectedTemplate: 'Aucun',
      previewData: [],
      validationResults: [],
      isImporting: false,
      config: {
        validateVRID: true,
        autoAssignLocation: false,
        notifyOnError: true,
        backup: true
      },
      fmcStats: {
        totalVRID: 127,
        totalPallets: 2456,
        avgProcessTime: 12.5,
        successRate: 98.2
      },
      importHistory: [
        {
          id: 1,
          fileName: 'fmc_weekly_report.csv',
          date: new Date('2024-10-26T16:45:00'),
          template: 'Standard FMC',
          successCount: 67,
          warningCount: 3,
          errorCount: 1
        },
        {
          id: 2,
          fileName: 'fmc_priority_batch.csv',
          date: new Date('2024-10-26T11:20:00'),
          template: 'FMC Étendu',
          successCount: 34,
          warningCount: 0,
          errorCount: 0
        }
      ],
      previewColumns: [],
      defaultColDef: {
        sortable: true,
        resizable: true,
        minWidth: 100
      },
      previewGridOptions: {
        animateRows: true,
        pagination: true,
        paginationPageSize: 10,
        suppressMenuHide: true
      }
    }
  },
  methods: {
    handleDragOver(e) {
      e.preventDefault();
      this.isDragOver = true;
    },
    handleDragLeave() {
      this.isDragOver = false;
    },
    handleDrop(e) {
      e.preventDefault();
      this.isDragOver = false;
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    },
    selectFile() {
      this.$refs.fileInput.click();
    },
    handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) {
        this.processFile(file);
      }
    },
    loadTemplate(templateType) {
      this.selectedTemplate = templateType;
      
      const templates = {
        standard: [
          { field: 'col1', headerName: 'VRID', width: 120 },
          { field: 'col2', headerName: 'Location', width: 100 },
          { field: 'col3', headerName: 'Pallets', width: 100 },
          { field: 'col4', headerName: 'Status', width: 120 },
          { field: 'col5', headerName: 'Date', width: 150 }
        ],
        extended: [
          { field: 'col1', headerName: 'VRID', width: 120 },
          { field: 'col2', headerName: 'Location', width: 100 },
          { field: 'col3', headerName: 'Pallets', width: 100 },
          { field: 'col4', headerName: 'Units', width: 100 },
          { field: 'col5', headerName: 'BT', width: 80 },
          { field: 'col6', headerName: 'Status', width: 120 },
          { field: 'col7', headerName: 'Priority', width: 100 }
        ],
        custom: [
          { field: 'col1', headerName: 'Colonne 1', width: 150 },
          { field: 'col2', headerName: 'Colonne 2', width: 150 },
          { field: 'col3', headerName: 'Colonne 3', width: 150 }
        ]
      };
      
      this.previewColumns = templates[templateType] || templates.custom;
      this.showNotification(`Template ${templateType} sélectionné`, 'info');
    },
    processFile(file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Veuillez sélectionner un fichier CSV');
        return;
      }

      this.fileName = file.name;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const csv = e.target.result;
        this.parseCSV(csv);
      };
      
      reader.readAsText(file);
    },
    parseCSV(csv) {
      const lines = csv.split('\n').filter(line => line.trim());
      if (lines.length === 0) return;

      // Parse les données
      const data = lines.slice(1, 11).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        values.forEach((value, i) => {
          row[`col${i + 1}`] = value;
        });
        return row;
      });

      this.fileData = lines;
      this.previewData = data;
      
      // Si aucun template sélectionné, utiliser le standard
      if (this.selectedTemplate === 'Aucun') {
        this.loadTemplate('standard');
      }

      // Validation des données
      this.validateData(data);
    },
    validateData(data) {
      this.validationResults = [];
      
      data.forEach((row, index) => {
        // Validation VRID
        if (!row.col1 || row.col1.length < 6) {
          this.validationResults.push({
            id: `error_${index}_1`,
            line: index + 2,
            type: 'error',
            message: 'VRID invalide ou manquant'
          });
        }
        
        // Validation Location
        if (!row.col2) {
          this.validationResults.push({
            id: `warning_${index}_2`,
            line: index + 2,
            type: 'warning',
            message: 'Location non spécifiée'
          });
        }
        
        // Validation Pallets
        if (row.col3 && isNaN(row.col3)) {
          this.validationResults.push({
            id: `error_${index}_3`,
            line: index + 2,
            type: 'error',
            message: 'Nombre de palettes invalide'
          });
        }
      });
    },
    async importData() {
      this.isImporting = true;
      
      try {
        // Simulation de l'import avec validation
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const errorCount = this.validationResults.filter(r => r.type === 'error').length;
        const warningCount = this.validationResults.filter(r => r.type === 'warning').length;
        
        // Ajouter à l'historique
        this.importHistory.unshift({
          id: Date.now(),
          fileName: this.fileName,
          date: new Date(),
          template: this.selectedTemplate,
          successCount: this.fileData.length - 1 - errorCount,
          warningCount: warningCount,
          errorCount: errorCount
        });

        // Notification
        if (errorCount === 0) {
          this.showNotification('Import FMC réussi!', 'success');
        } else {
          this.showNotification(`Import terminé avec ${errorCount} erreurs`, 'warning');
        }
        
        // Réinitialiser
        this.resetImport();
        
      } catch (error) {
        this.showNotification('Erreur lors de l\'import FMC', 'error');
      } finally {
        this.isImporting = false;
      }
    },
    resetImport() {
      this.fileData = null;
      this.fileName = '';
      this.previewData = [];
      this.validationResults = [];
      this.selectedTemplate = 'Aucun';
    },
    formatDate(date) {
      return date.toLocaleString('fr-FR');
    },
    downloadLog(entry) {
      console.log('Téléchargement du rapport pour:', entry.fileName);
    },
    reimport(entry) {
      console.log('Re-import de:', entry.fileName);
    },
    exportTemplate(entry) {
      console.log('Export du template pour:', entry.fileName);
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
  }
}
</script>

<style scoped>
.fmc-import-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.import-header {
  text-align: center;
  margin-bottom: 30px;
}

.import-header h2 {
  color: #f39c12;
  margin-bottom: 10px;
}

.file-drop-zone {
  border: 3px dashed #bdc3c7;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  margin-bottom: 30px;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.file-drop-zone.dragover {
  border-color: #f39c12;
  background: #ffeaa7;
}

.drop-icon {
  font-size: 3rem;
  color: #f39c12;
}

.templates-section {
  margin-bottom: 30px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.template-card {
  background: white;
  border: 2px solid #ecf0f1;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  border-color: #f39c12;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.template-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.template-card h4 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.template-card p {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.file-preview {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.preview-table {
  height: 300px;
}

.validation-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.validation-list {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 15px;
}

.validation-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 5px;
  border-radius: 5px;
  gap: 10px;
}

.validation-item.error {
  background: #fdf2f2;
  border-left: 4px solid #e74c3c;
}

.validation-item.warning {
  background: #fef9e7;
  border-left: 4px solid #f39c12;
}

.validation-item.info {
  background: #e3f2fd;
  border-left: 4px solid #3498db;
}

.fmc-stats {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
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
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-left: 4px solid #f39c12;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content h4 {
  font-size: 1.5rem;
  margin: 0;
  color: #2c3e50;
}

.stat-content p {
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.advanced-config {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.config-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.config-item label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 5px;
  transition: background-color 0.2s ease;
}

.config-item label:hover {
  background: #f8f9fa;
}

.history-item.fmc {
  border-left-color: #f39c12;
}

.history-template {
  color: #f39c12;
  font-size: 0.8rem;
  font-weight: bold;
}

.warning-count {
  color: #f39c12;
  font-weight: bold;
}

/* Notifications spécifiques */
:global(.notification.info) {
  background: #3498db;
}

:global(.notification.warning) {
  background: #f39c12;
}

@media (max-width: 768px) {
  .templates-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .config-options {
    grid-template-columns: 1fr;
  }
}
</style>