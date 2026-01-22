<template>
  <div class="aft-import-container">
    <!-- Interface d'import CSV spécialisée AFT -->
    <CSVImportInterface
      :default-import-type="'AFT'"
      :restricted-to-type="true"
      @navigate-to-tab="$emit('navigate-to-tab', $event)"
    />
    
    <div class="import-header">
      <h2>📥 Import AFT (Advanced Freight Transport) - ImportCSVToAFTV3</h2>
      <p>Reproduction de la fonction VBA avec nettoyage automatique et formatage</p>
    </div>

    <!-- Zone de dépôt de fichier -->
    <div class="file-drop-zone" 
         :class="{ 'dragover': isDragOver }"
         @drop="handleDrop"
         @dragover="handleDragOver"
         @dragleave="handleDragLeave">
      <div class="drop-content">
        <div class="drop-icon">📁</div>
        <h3>Glissez votre fichier CSV AFT ici</h3>
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

    <!-- Aperçu du fichier -->
    <div v-if="fileData" class="file-preview">
      <div class="preview-header">
        <h3>📋 Aperçu: {{ fileName }}</h3>
        <div class="file-info">
          <span>{{ fileData.length }} lignes détectées</span>
          <button class="btn btn-success" @click="importData" :disabled="isImporting">
            {{ isImporting ? 'Import en cours...' : '✅ Importer les données' }}
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

    <!-- Configuration des colonnes -->
    <div v-if="fileData" class="column-mapping">
      <h3>🔗 Correspondance des colonnes</h3>
      <div class="mapping-grid">
        <div v-for="(col, index) in detectedColumns" :key="index" class="mapping-item">
          <label>{{ col }} :</label>
          <select v-model="columnMapping[col]">
            <option value="">-- Ignorer --</option>
            <option value="vrid">VRID</option>
            <option value="statut">Statut</option>
            <option value="pallets">Pallets</option>
            <option value="bt">BT</option>
            <option value="units">Units</option>
            <option value="location">Location</option>
            <option value="remorques">Remorques</option>
            <option value="sbd">SBD</option>
            <option value="ymsArrivalTime">YMS Arrival Time</option>
            <option value="fcSource">FC Source</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Historique des imports -->
    <div class="import-history">
      <h3>📜 Historique des imports AFT</h3>
      <div class="history-list">
        <div v-for="entry in importHistory" :key="entry.id" class="history-item">
          <div class="history-info">
            <strong>{{ entry.fileName }}</strong>
            <span class="history-date">{{ formatDate(entry.date) }}</span>
          </div>
          <div class="history-stats">
            <span class="success-count">✅ {{ entry.successCount }}</span>
            <span class="error-count" v-if="entry.errorCount > 0">❌ {{ entry.errorCount }}</span>
          </div>
          <div class="history-actions">
            <button class="btn-small" @click="downloadLog(entry)">📄 Log</button>
            <button class="btn-small" @click="reimport(entry)">🔄 Re-importer</button>
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
  name: 'AFTImport',
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
      previewData: [],
      detectedColumns: [],
      columnMapping: {},
      isImporting: false,
      importHistory: [
        {
          id: 1,
          fileName: 'aft_data_2024-10-26.csv',
          date: new Date('2024-10-26T14:30:00'),
          successCount: 45,
          errorCount: 2
        },
        {
          id: 2,
          fileName: 'aft_morning_batch.csv',
          date: new Date('2024-10-26T08:15:00'),
          successCount: 28,
          errorCount: 0
        }
      ],
      previewColumns: [
        { field: 'col1', headerName: 'Colonne 1', width: 150 },
        { field: 'col2', headerName: 'Colonne 2', width: 150 },
        { field: 'col3', headerName: 'Colonne 3', width: 150 },
        { field: 'col4', headerName: 'Colonne 4', width: 150 },
        { field: 'col5', headerName: 'Colonne 5', width: 150 }
      ],
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

      // Première ligne = en-têtes
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      this.detectedColumns = headers;
      
      // Données
      const data = lines.slice(1, 11).map((line, index) => { // Limiter à 10 lignes pour l'aperçu
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, i) => {
          row[`col${i + 1}`] = values[i] || '';
        });
        return row;
      });

      this.fileData = lines;
      this.previewData = data;
      
      // Mettre à jour les colonnes de l'aperçu
      this.previewColumns = headers.map((header, index) => ({
        field: `col${index + 1}`,
        headerName: header,
        width: 150
      }));

      // Auto-mapping des colonnes courantes
      this.autoMapColumns(headers);
    },
    autoMapColumns(headers) {
      const mappings = {
        'vrid': ['vrid', 'id', 'identifier'],
        'statut': ['status', 'statut', 'state'],
        'pallets': ['pallets', 'palette', 'pallet'],
        'bt': ['bt', 'batch', 'lot'],
        'units': ['units', 'unites', 'quantity'],
        'location': ['location', 'localisation', 'dock'],
        'remorques': ['trailer', 'remorque', 'truck'],
        'sbd': ['sbd', 'scheduled', 'planned'],
        'ymsArrivalTime': ['arrival', 'arrivee', 'yms'],
        'fcSource': ['source', 'fc', 'system']
      };

      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        for (const [field, keywords] of Object.entries(mappings)) {
          if (keywords.some(keyword => lowerHeader.includes(keyword))) {
            this.columnMapping[header] = field;
            break;
          }
        }
      });
    },
    async importData() {
      this.isImporting = true;
      
      try {
        // Simulation de l'import
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ajouter à l'historique
        this.importHistory.unshift({
          id: Date.now(),
          fileName: this.fileName,
          date: new Date(),
          successCount: this.fileData.length - 1, // -1 pour l'en-tête
          errorCount: 0
        });

        // Notification de succès
        this.showNotification('Import AFT réussi!', 'success');
        
        // Réinitialiser
        this.fileData = null;
        this.fileName = '';
        this.previewData = [];
        this.columnMapping = {};
        
      } catch (error) {
        this.showNotification('Erreur lors de l\'import', 'error');
      } finally {
        this.isImporting = false;
      }
    },
    formatDate(date) {
      return date.toLocaleString('fr-FR');
    },
    downloadLog(entry) {
      console.log('Téléchargement du log pour:', entry.fileName);
    },
    reimport(entry) {
      console.log('Re-import de:', entry.fileName);
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
.aft-import-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.import-header {
  text-align: center;
  margin-bottom: 30px;
}

.import-header h2 {
  color: #e74c3c;
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
  border-color: #e74c3c;
  background: #ffeaa7;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.drop-icon {
  font-size: 3rem;
  color: #e74c3c;
}

.file-preview {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.preview-table {
  height: 300px;
}

.column-mapping {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.mapping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mapping-item label {
  font-weight: bold;
  min-width: 120px;
  color: #2c3e50;
}

.mapping-item select {
  flex: 1;
  padding: 8px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
}

.import-history {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.history-date {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.history-stats {
  display: flex;
  gap: 10px;
}

.success-count {
  color: #27ae60;
  font-weight: bold;
}

.error-count {
  color: #e74c3c;
  font-weight: bold;
}

.history-actions {
  display: flex;
  gap: 5px;
}

.btn-small {
  padding: 5px 10px;
  font-size: 0.8rem;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small:hover {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

/* Notifications */
:global(.notification) {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

:global(.notification.success) {
  background: #27ae60;
}

:global(.notification.error) {
  background: #e74c3c;
}

@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .history-item {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .mapping-grid {
    grid-template-columns: 1fr;
  }
}
</style>