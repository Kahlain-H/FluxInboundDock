<template>
  <div class="flux-dock-container">
    <!-- Barre d'outils -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="btn btn-success" @click="refreshData">
          🔄 Actualiser
        </button>
        <button class="btn btn-primary" @click="importCSV">
          📥 Import CSV
        </button>
        <button class="btn btn-warning" @click="exportData">
          📤 Export
        </button>
      </div>
      <div class="toolbar-right">
        <div class="status-summary">
          <span class="status-badge in-progress">IN PROGRESS: {{ getStatusCount('IN PROGRESS') }}</span>
          <span class="status-badge vrac">VRAC: {{ getStatusCount('VRAC') }}</span>
          <span class="status-badge palettized">PALETTIZED: {{ getStatusCount('PALETTIZED') }}</span>
          <span class="status-badge done">DONE: {{ getStatusCount('DONE') }}</span>
        </div>
        <span class="total-count">Total: {{ logisticsData.length }} VRID</span>
      </div>
    </div>

    <!-- Grille logistique -->
    <div class="grid-container">
      <ag-grid-vue
        class="ag-theme-alpine logistics-grid"
        :columnDefs="columnDefs"
  :rowData="uniqueLogisticsData"
        :defaultColDef="defaultColDef"
        :gridOptions="gridOptions"
        @row-selected="onRowSelected"
        @cell-value-changed="onCellValueChanged"
        @grid-ready="onGridReady">
      </ag-grid-vue>
    </div>

    <!-- Détails de la sélection -->
    <div v-if="selectedVRID" class="details-panel">
      <h3>Détails VRID: {{ selectedVRID.vrid }}</h3>
      <div class="details-grid">
        <div class="detail-item">
          <label>Statut:</label>
          <span :class="'status-' + selectedVRID.statut.toLowerCase().replace(' ', '-')">
            {{ selectedVRID.statut }}
          </span>
        </div>
        <div class="detail-item">
          <label>Palettes:</label>
          <span>{{ selectedVRID.pallets }}</span>
        </div>
        <div class="detail-item">
          <label>BT:</label>
          <span>{{ selectedVRID.bt }}</span>
        </div>
        <div class="detail-item">
          <label>Unités:</label>
          <span>{{ selectedVRID.units }}</span>
        </div>
        <div class="detail-item">
          <label>Location:</label>
          <span>{{ selectedVRID.location }}</span>
        </div>
        <div class="detail-item">
          <label>Remorque:</label>
          <span>{{ selectedVRID.remorques }}</span>
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
  name: 'FluxDockInbound',
  components: {
    AgGridVue
  },
  computed: {
    uniqueLogisticsData() {
      const seen = new Set();
      return this.logisticsData.filter(item => {
        if (seen.has(item.vrid)) {
          return false;
        }
        seen.add(item.vrid);
        return true;
      });
    }
  },
  data() {
    return {
      selectedVRID: null,
      gridApi: null,
      logisticsData: [
        {
          id: 1,
          statut: 'IN PROGRESS',
          vrid: 'VR240001',
          pallets: 24,
          bt: 8,
          units: 1200,
          sbd: '2024-10-27 08:30:00',
          ymsArrivalTime: '2024-10-27 07:45:00',
          location: 'DOCK-A1',
          remorques: 'TR-001',
          statutDetaille: 'Déchargement en cours',
          fcSource: 'AFT-SYSTEM'
        },
        {
          id: 2,
          statut: 'VRAC',
          vrid: 'VR240002',
          pallets: 0,
          bt: 15,
          units: 850,
          sbd: '2024-10-27 09:15:00',
          ymsArrivalTime: '2024-10-27 08:30:00',
          location: 'DOCK-B2',
          remorques: 'TR-005',
          statutDetaille: 'Marchandise en vrac',
          fcSource: 'FMC-SYSTEM'
        },
        {
          id: 3,
          statut: 'PALETTIZED',
          vrid: 'VR240003',
          pallets: 18,
          bt: 6,
          units: 900,
          sbd: '2024-10-27 10:00:00',
          ymsArrivalTime: '2024-10-27 09:15:00',
          location: 'DOCK-C3',
          remorques: 'TR-012',
          statutDetaille: 'Palettisation terminée',
          fcSource: 'SKYNET'
        },
        {
          id: 4,
          statut: 'DONE',
          vrid: 'VR240004',
          pallets: 32,
          bt: 10,
          units: 1600,
          sbd: '2024-10-27 06:00:00',
          ymsArrivalTime: '2024-10-27 05:30:00',
          location: 'STOCK-Z1',
          remorques: 'TR-008',
          statutDetaille: 'Traitement terminé',
          fcSource: 'AFT-SYSTEM'
        },
        {
          id: 5,
          statut: 'IN PROGRESS',
          vrid: 'VR240005',
          pallets: 12,
          bt: 4,
          units: 600,
          sbd: '2024-10-27 11:30:00',
          ymsArrivalTime: '2024-10-27 11:00:00',
          location: 'DOCK-A2',
          remorques: 'TR-015',
          statutDetaille: 'Contrôle qualité',
          fcSource: 'FMC-SYSTEM'
        }
      ],
      columnDefs: [
        {
          field: 'statut',
          headerName: 'Statut',
          width: 130,
          pinned: 'left',
          cellRenderer: this.statusCellRenderer,
          filter: true
        },
        {
          field: 'vrid',
          headerName: 'VRID',
          width: 120,
          pinned: 'left',
          cellStyle: { fontWeight: 'bold', color: '#2c3e50' }
        },
        {
          field: 'pallets',
          headerName: 'PALLETS',
          width: 100,
          type: 'numericColumn',
          cellStyle: { textAlign: 'center' }
        },
        {
          field: 'bt',
          headerName: 'BT',
          width: 80,
          type: 'numericColumn',
          cellStyle: { textAlign: 'center' }
        },
        {
          field: 'units',
          headerName: 'UNITS',
          width: 100,
          type: 'numericColumn',
          valueFormatter: params => params.value.toLocaleString()
        },
        {
          field: 'sbd',
          headerName: 'SBD',
          width: 160,
          filter: 'agDateColumnFilter'
        },
        {
          field: 'ymsArrivalTime',
          headerName: 'YMS Arrival Time',
          width: 160,
          filter: 'agDateColumnFilter'
        },
        {
          field: 'location',
          headerName: 'LOCATION',
          width: 120,
          cellStyle: { fontWeight: 'bold' }
        },
        {
          field: 'remorques',
          headerName: 'REMORQUES',
          width: 120
        },
        {
          field: 'statutDetaille',
          headerName: 'Statut détaillé',
          width: 180
        },
        {
          field: 'fcSource',
          headerName: 'FC Source',
          width: 120,
          cellRenderer: this.sourceCellRenderer
        }
      ],
      defaultColDef: {
        sortable: true,
        resizable: true,
        filter: true,
        minWidth: 80
      },
      gridOptions: {
        animateRows: true,
        enableCellTextSelection: true,
        pagination: true,
        paginationPageSize: 20,
        rowSelection: 'single',
        enableRangeSelection: true,
        suppressMenuHide: true,
        rowHeight: 35,
        headerHeight: 40
      }
    }
  },
  methods: {
    statusCellRenderer(params) {
      const status = params.value;
      let className = '';
      let icon = '';
      
      switch(status) {
        case 'IN PROGRESS':
          className = 'status-in-progress';
          icon = '🔄';
          break;
        case 'VRAC':
          className = 'status-vrac';
          icon = '📦';
          break;
        case 'PALETTIZED':
          className = 'status-palettized';
          icon = '🏗️';
          break;
        case 'DONE':
          className = 'status-done';
          icon = '✅';
          break;
        default:
          className = 'status-unknown';
          icon = '❓';
      }
      
      return `<span class="${className}">${icon} ${status}</span>`;
    },
    sourceCellRenderer(params) {
      const source = params.value;
      let color = '#3498db';
      
      switch(source) {
        case 'AFT-SYSTEM':
          color = '#e74c3c';
          break;
        case 'FMC-SYSTEM':
          color = '#f39c12';
          break;
        case 'SKYNET':
          color = '#9b59b6';
          break;
      }
      
      return `<span style="color: ${color}; font-weight: bold;">${source}</span>`;
    },
    onGridReady(params) {
      this.gridApi = params.api;
      params.api.sizeColumnsToFit();
    },
    onRowSelected(event) {
      this.selectedVRID = event.data;
    },
    onCellValueChanged(event) {
      console.log('Données modifiées:', event);
    },
    getStatusCount(status) {
      return this.logisticsData.filter(item => item.statut === status).length;
    },
    refreshData() {
      console.log('Actualisation des données...');
      // Ici, vous ajouteriez la logique pour récupérer les données du serveur
      if (this.gridApi) {
        this.gridApi.refreshCells();
      }
    },
    importCSV() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          this.processCSVFile(file);
        }
      };
      input.click();
    },
    processCSVFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        console.log('Fichier CSV chargé:', file.name);
        // Ici, vous ajouteriez la logique pour parser le CSV
      };
      reader.readAsText(file);
    },
    exportData() {
      if (this.gridApi) {
        this.gridApi.exportDataAsCsv({
          fileName: `flux_dock_export_${new Date().toISOString().split('T')[0]}.csv`
        });
      }
    }
  }
}
</script>

<style scoped>
.flux-dock-container {
  padding: 20px;
}

.logistics-grid {
  height: 600px;
  width: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-summary {
  display: flex;
  gap: 10px;
  margin-right: 20px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.status-badge.in-progress { background-color: #3498db; }
.status-badge.vrac { background-color: #f39c12; }
.status-badge.palettized { background-color: #9b59b6; }
.status-badge.done { background-color: #27ae60; }

.details-panel {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

/* Styles pour les cellules de statut */
:deep(.status-in-progress) {
  background-color: #3498db;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

:deep(.status-vrac) {
  background-color: #f39c12;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

:deep(.status-palettized) {
  background-color: #9b59b6;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

:deep(.status-done) {
  background-color: #27ae60;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.total-count {
  font-weight: bold;
  color: #2c3e50;
}
</style>