<template>
  <div class="grid-container">
    <ag-grid-vue
      class="ag-theme-alpine"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      :gridOptions="gridOptions"
      @row-selected="onRowSelected"
      @cell-value-changed="onCellValueChanged"
      @grid-ready="onGridReady">
    </ag-grid-vue>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

export default {
  name: 'DataGrid',
  components: {
    AgGridVue
  },
  props: {
    rowData: {
      type: Array,
      default: () => []
    },
    columnDefs: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      gridApi: null,
      columnApi: null,
      defaultColDef: {
        sortable: true,
        resizable: true,
        filter: true,
        editable: false,
        minWidth: 100
      },
      gridOptions: {
        animateRows: true,
        enableCellTextSelection: true,
        ensureDomOrder: true,
        pagination: true,
        paginationPageSize: 10,
        rowSelection: 'single',
        enableRangeSelection: true,
        suppressMenuHide: true,
        sideBar: {
          toolPanels: [
            {
              id: 'columns',
              labelDefault: 'Colonnes',
              labelKey: 'columns',
              iconKey: 'columns',
              toolPanel: 'agColumnsToolPanel',
            },
            {
              id: 'filters',
              labelDefault: 'Filtres',
              labelKey: 'filters',
              iconKey: 'filter',
              toolPanel: 'agFiltersToolPanel',
            }
          ],
          defaultToolPanel: 'columns'
        },
        statusBar: {
          statusPanels: [
            {
              statusPanel: 'agTotalAndFilteredRowCountComponent',
              align: 'left'
            },
            {
              statusPanel: 'agSelectedRowCountComponent',
              align: 'center'
            },
            {
              statusPanel: 'agAggregationComponent',
              align: 'right'
            }
          ]
        }
      }
    }
  },
  methods: {
    onGridReady(params) {
      this.gridApi = params.api;
      this.columnApi = params.columnApi;
      
      // Auto-ajuster la largeur des colonnes
      params.api.sizeColumnsToFit();
      
      console.log('AG-Grid est prêt!');
    },
    onRowSelected(event) {
      this.$emit('rowSelected', event);
    },
    onCellValueChanged(event) {
      this.$emit('cellValueChanged', event);
    },
    // Méthodes utilitaires exposées pour le composant parent
    exportToCsv() {
      if (this.gridApi) {
        this.gridApi.exportDataAsCsv({
          fileName: 'flux_inbound_export.csv'
        });
      }
    },
    clearSelection() {
      if (this.gridApi) {
        this.gridApi.deselectAll();
      }
    },
    refreshData() {
      if (this.gridApi) {
        this.gridApi.refreshCells();
      }
    },
    fitColumns() {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
      }
    },
    getSelectedRows() {
      if (this.gridApi) {
        return this.gridApi.getSelectedRows();
      }
      return [];
    }
  },
  watch: {
    rowData: {
      handler() {
        // Actualiser le grid quand les données changent
        if (this.gridApi) {
          this.gridApi.setRowData(this.rowData);
        }
      },
      deep: true
    }
  },
  mounted() {
    // Ajuster les colonnes lors du redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
      if (this.gridApi) {
        setTimeout(() => {
          this.gridApi.sizeColumnsToFit();
        }, 100);
      }
    });
  }
}
</script>

<style scoped>
.grid-container {
  position: relative;
}

/* Personnalisation du thème AG-Grid */
.ag-theme-alpine {
  --ag-header-height: 45px;
  --ag-header-foreground-color: #2c3e50;
  --ag-header-background-color: #ecf0f1;
  --ag-odd-row-background-color: #f8f9fa;
  --ag-row-hover-color: #e3f2fd;
  --ag-selected-row-background-color: #bbdefb;
  --ag-border-color: #bdc3c7;
  --ag-font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Styles responsifs pour mobile */
@media (max-width: 768px) {
  .ag-theme-alpine {
    --ag-header-height: 40px;
    font-size: 14px;
  }
}
</style>