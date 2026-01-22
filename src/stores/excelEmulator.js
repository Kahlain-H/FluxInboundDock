import { reactive, ref, computed } from 'vue'
import logisticsStore, { logisticsActions, logisticsGetters } from './logisticsStore.js'

// Configuration pour la synchronisation avec Excel
export const CONFIG_EXCEL = {
  SHEETS: {
    FLUX_DOCK: 'Flux_Dock_Inbound',
    AFT: 'AFT_Import',
    FMC: 'FMC_Import',
    SKYNET: 'Skynet_Data',
    DASHBOARD: 'Dashboard_Metrics'
  },
  COLUMNS: {
    FLUX_DOCK: {
      VRID: 'A',
      STATUT: 'B',
      PALLETS: 'C',
      BT: 'D',
      UNITS: 'E',
      SBD: 'F',
      YMS_ARRIVAL: 'G',
      LOCATION: 'H',
      REMORQUES: 'I',
      PRIORITY: 'J',
      FC_SOURCE: 'K',
      STATUT_DETAILLE: 'L',
      TEMPS_RESTANT: 'M',
      BACKLOG_POSITION: 'N'
    }
  },
  FORMULAS: {
    TEMPS_RESTANT: '=IF(B{row}="DONE","",MAX(0,F{row}+TIME(8,0,0)-NOW()))',
    BACKLOG_POSITION: '=IF(B{row}="DONE","",RANK(F{row},F:F,1))',
    STATUS_COLOR: '=IF(B{row}="IN PROGRESS","#3498db",IF(B{row}="VRAC","#f39c12",IF(B{row}="PALETTIZED","#9b59b6","#27ae60")))'
  }
}

// Émulateur de fonctions Excel VBA en JavaScript
export const excelEmulator = {
  // Équivalent de Application.WorksheetFunction
  worksheetFunction: {
    // Équivalent de VLOOKUP
    vlookup: (lookupValue, tableArray, colIndexNum, rangeLookup = false) => {
      for (let i = 0; i < tableArray.length; i++) {
        const row = tableArray[i]
        if (rangeLookup) {
          if (row[0] <= lookupValue) {
            return row[colIndexNum - 1]
          }
        } else {
          if (row[0] === lookupValue) {
            return row[colIndexNum - 1]
          }
        }
      }
      throw new Error('#N/A')
    },

    // Équivalent de SUMIF
    sumif: (range, criteria, sumRange = null) => {
      const targetRange = sumRange || range
      let sum = 0
      for (let i = 0; i < range.length; i++) {
        if (range[i] === criteria) {
          sum += targetRange[i]
        }
      }
      return sum
    },

    // Équivalent de COUNTIF
    countif: (range, criteria) => {
      return range.filter(item => item === criteria).length
    },

    // Équivalent de AVERAGEIF
    averageif: (range, criteria, averageRange = null) => {
      const targetRange = averageRange || range
      let sum = 0
      let count = 0
      for (let i = 0; i < range.length; i++) {
        if (range[i] === criteria) {
          sum += targetRange[i]
          count++
        }
      }
      return count > 0 ? sum / count : 0
    },

    // Équivalent de MAX/MIN
    max: (array) => Math.max(...array.filter(x => typeof x === 'number')),
    min: (array) => Math.min(...array.filter(x => typeof x === 'number')),

    // Équivalent de NOW()
    now: () => new Date(),

    // Équivalent de TIME()
    time: (hours, minutes, seconds) => {
      return hours * 3600000 + minutes * 60000 + seconds * 1000
    }
  },

  // Émulation des ranges Excel
  range: {
    // Créer une référence de cellule
    cell: (sheet, column, row) => `${sheet}!${column}${row}`,

    // Créer une référence de plage
    range: (sheet, startColumn, startRow, endColumn, endRow) => 
      `${sheet}!${startColumn}${startRow}:${endColumn}${endRow}`,

    // Parser une référence de cellule
    parseCell: (cellRef) => {
      const match = cellRef.match(/([A-Z]+)(\d+)/)
      return {
        column: match[1],
        row: parseInt(match[2])
      }
    }
  },

  // Émulation des événements de feuille
  worksheet: {
    // Équivalent de Worksheet_Change
    onChange: (cell, oldValue, newValue) => {
      console.log(`Cell ${cell} changed from ${oldValue} to ${newValue}`)
      
      // Logique équivalente aux événements VBA
      const { column, row } = excelEmulator.range.parseCell(cell)
      
      // Si changement de statut
      if (column === 'B') {
        excelEmulator.events.onStatusChange(row, newValue)
      }
      
      // Si changement de location
      if (column === 'H') {
        excelEmulator.events.onLocationChange(row, newValue)
      }
      
      // Si changement de priorité
      if (column === 'J') {
        excelEmulator.events.onPriorityChange(row, newValue)
      }
    },

    // Équivalent de Worksheet_SelectionChange
    onSelectionChange: (cell) => {
      console.log(`Selection changed to ${cell}`)
      // Mise à jour des informations de la sélection
    }
  },

  // Gestionnaires d'événements équivalents aux macros VBA
  events: {
    onStatusChange: (row, newStatus) => {
      const vridId = logisticsStore.store.vridData[row - 2]?.id // -2 car header
      if (vridId) {
        logisticsActions.moveVRIDStatus(vridId, newStatus)
        excelEmulator.macros.updateFormulas(row)
        excelEmulator.macros.sortByFIFO()
      }
    },

    onLocationChange: (row, newLocation) => {
      const vridId = logisticsStore.store.vridData[row - 2]?.id
      if (vridId) {
        const vrid = logisticsStore.store.vridData.find(v => v.id === vridId)
        if (vrid) {
          vrid.location = newLocation
          vrid.updatedAt = new Date()
          logisticsActions.updateMetrics()
        }
      }
    },

    onPriorityChange: (row, newPriority) => {
      const vridId = logisticsStore.store.vridData[row - 2]?.id
      if (vridId) {
        logisticsActions.updateVRIDPriority(vridId, newPriority)
      }
    }
  },

  // Équivalents des macros VBA
  macros: {
    // Macro pour trier par FIFO
    sortByFIFO: () => {
      logisticsActions.sortVRIDByFIFO()
      console.log('Tri FIFO appliqué (équivalent macro Excel)')
    },

    // Macro pour actualiser les données
    refreshData: () => {
      logisticsActions.updateMetrics()
      logisticsActions.updateBacklog()
      logisticsActions.updateTimeRemaining()
      console.log('Données actualisées (équivalent macro Excel)')
    },

    // Macro pour mettre à jour les formules
    updateFormulas: (row) => {
      // Simulation de la mise à jour des formules Excel
      const vrid = logisticsStore.store.vridData[row - 2]
      if (vrid) {
        // Calcul temps restant (équivalent formule Excel)
        if (vrid.statut === 'DONE') {
          vrid.timeRemaining = null
        } else {
          const sbd = new Date(vrid.sbd)
          const deadline = new Date(sbd.getTime() + 8 * 60 * 60 * 1000) // +8h
          vrid.timeRemaining = Math.max(0, deadline - new Date())
        }
        
        // Mise à jour position backlog
        excelEmulator.macros.updateBacklogPositions()
      }
    },

    // Macro pour mettre à jour les positions backlog
    updateBacklogPositions: () => {
      const activeVRIDs = logisticsStore.store.vridData
        .filter(v => v.statut !== 'DONE')
        .sort((a, b) => new Date(a.sbd) - new Date(b.sbd))
      
      activeVRIDs.forEach((vrid, index) => {
        vrid.backlogPosition = index + 1
      })
    },

    // Macro pour export Excel
    exportToExcel: () => {
      const data = logisticsStore.store.vridData
      const csvContent = excelEmulator.csv.generateCSV(data)
      excelEmulator.csv.downloadFile(csvContent, 'flux_dock_export.csv')
      console.log('Export Excel effectué')
    },

    // Macro pour import CSV
    importFromCSV: (csvContent, sourceType) => {
      const data = excelEmulator.csv.parseCSV(csvContent)
      
      data.forEach(row => {
        const newVRID = {
          id: Date.now() + Math.random(),
          vrid: row.vrid,
          statut: row.statut || 'IN PROGRESS',
          pallets: parseInt(row.pallets) || 0,
          bt: parseInt(row.bt) || 0,
          units: parseInt(row.units) || 0,
          sbd: new Date(row.sbd),
          ymsArrivalTime: new Date(row.ymsArrivalTime),
          location: row.location || 'QUEUE',
          remorques: row.remorques || '',
          priority: row.priority || 'MEDIUM',
          fcSource: sourceType,
          statutDetaille: row.statutDetaille || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        logisticsStore.store.vridData.push(newVRID)
      })
      
      excelEmulator.macros.refreshData()
      console.log(`Import ${sourceType} effectué: ${data.length} lignes`)
    }
  },

  // Utilitaires CSV (équivalent des fonctions d'import/export Excel)
  csv: {
    parseCSV: (csvContent) => {
      const lines = csvContent.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      return lines.slice(1).map(line => {
        const values = line.split(',')
        const row = {}
        headers.forEach((header, index) => {
          row[header.toLowerCase()] = values[index]?.trim()
        })
        return row
      }).filter(row => row.vrid) // Filtrer les lignes vides
    },

    generateCSV: (data) => {
      const headers = [
        'VRID', 'Statut', 'Pallets', 'BT', 'Units', 'SBD', 'YMS Arrival',
        'Location', 'Remorques', 'Priority', 'Source', 'Statut Detaille'
      ]
      
      const rows = data.map(item => [
        item.vrid,
        item.statut,
        item.pallets,
        item.bt,
        item.units,
        item.sbd.toISOString(),
        item.ymsArrivalTime.toISOString(),
        item.location,
        item.remorques,
        item.priority,
        item.fcSource,
        item.statutDetaille
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    },

    downloadFile: (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  },

  // Validation des données (équivalent des validations VBA)
  validation: {
    // Valider les transitions de statut
    validateStatusTransition: (currentStatus, newStatus) => {
      const validTransitions = {
        'IN PROGRESS': ['VRAC', 'DONE'],
        'VRAC': ['PALETTIZED', 'DONE'],
        'PALETTIZED': ['DONE'],
        'DONE': []
      }
      
      return validTransitions[currentStatus]?.includes(newStatus) || false
    },

    // Valider les emplacements
    validateLocation: (location, status) => {
      const validLocations = {
        'IN PROGRESS': ['QUEUE', 'QUAI_1', 'QUAI_2', 'QUAI_3'],
        'VRAC': ['QUAI_1', 'QUAI_2', 'QUAI_3', 'ZONE_VRAC'],
        'PALETTIZED': ['ZONE_PALETTE', 'QUAI_1', 'QUAI_2', 'QUAI_3'],
        'DONE': ['STOCK_A', 'STOCK_B', 'STOCK_C', 'EXPEDIE']
      }
      
      return validLocations[status]?.includes(location) || false
    },

    // Valider les données VRID
    validateVRID: (vridData) => {
      const errors = []
      
      if (!vridData.vrid || vridData.vrid.length < 3) {
        errors.push('VRID invalide')
      }
      
      if (vridData.pallets < 0 || vridData.bt < 0 || vridData.units < 0) {
        errors.push('Valeurs numériques négatives')
      }
      
      if (!['HIGH', 'MEDIUM', 'LOW'].includes(vridData.priority)) {
        errors.push('Priorité invalide')
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      }
    }
  },

  // Calculs métiers (équivalent des fonctions VBA personnalisées)
  calculations: {
    // Calculer le temps de traitement moyen
    averageProcessingTime: () => {
      const completedVRIDs = logisticsStore.store.vridData
        .filter(v => v.statut === 'DONE' && v.completedAt)
      
      if (completedVRIDs.length === 0) return 0
      
      const totalTime = completedVRIDs.reduce((sum, vrid) => {
        return sum + (vrid.completedAt - vrid.createdAt)
      }, 0)
      
      return totalTime / completedVRIDs.length
    },

    // Calculer le taux de performance
    performanceRate: () => {
      const totalVRIDs = logisticsStore.store.vridData.length
      const completedVRIDs = logisticsStore.store.vridData.filter(v => v.statut === 'DONE').length
      
      return totalVRIDs > 0 ? (completedVRIDs / totalVRIDs) * 100 : 0
    },

    // Calculer les alertes de délai
    delayAlerts: () => {
      const alerts = []
      const now = new Date()
      
      logisticsStore.store.vridData.forEach(vrid => {
        if (vrid.statut !== 'DONE') {
          const sbd = new Date(vrid.sbd)
          const deadline = new Date(sbd.getTime() + 8 * 60 * 60 * 1000) // +8h
          const timeRemaining = deadline - now
          
          if (timeRemaining < 0) {
            alerts.push({
              type: 'critical',
              vrid: vrid.vrid,
              message: `VRID ${vrid.vrid} en retard de ${Math.abs(Math.floor(timeRemaining / 60000))} minutes`,
              delay: Math.abs(timeRemaining)
            })
          } else if (timeRemaining < 3600000) { // < 1h
            alerts.push({
              type: 'warning',
              vrid: vrid.vrid,
              message: `VRID ${vrid.vrid} expire dans ${Math.floor(timeRemaining / 60000)} minutes`,
              timeRemaining: timeRemaining
            })
          }
        }
      })
      
      return alerts.sort((a, b) => (a.delay || 0) - (b.delay || 0))
    },

    // Calculer les prévisions de charge
    workloadForecast: () => {
      const hourlyData = {}
      const now = new Date()
      
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now.getTime() + i * 60 * 60 * 1000)
        const hourKey = hour.getHours()
        
        hourlyData[hourKey] = {
          expectedArrivals: 0,
          expectedCompletions: 0,
          workload: 0
        }
      }
      
      logisticsStore.store.vridData.forEach(vrid => {
        const arrivalHour = new Date(vrid.ymsArrivalTime).getHours()
        if (hourlyData[arrivalHour]) {
          hourlyData[arrivalHour].expectedArrivals++
          hourlyData[arrivalHour].workload += vrid.pallets
        }
      })
      
      return hourlyData
    }
  }
}

// Interface principale pour la synchronisation Excel
export const excelSync = {
  // Initialiser la synchronisation
  init: () => {
    console.log('Synchronisation Excel initialisée')
    
    // Démarrer les mises à jour automatiques (équivalent des timers VBA)
    setInterval(() => {
      excelEmulator.macros.refreshData()
    }, 30000) // Toutes les 30 secondes
    
    // Démarrer le calcul des alertes
    setInterval(() => {
      const alerts = excelEmulator.calculations.delayAlerts()
      alerts.forEach(alert => {
        logisticsActions.addAlert(alert)
      })
    }, 60000) // Toutes les minutes
  },

  // Importer des données (équivalent ouverture fichier Excel)
  importData: (file, sourceType) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target.result
          excelEmulator.macros.importFromCSV(content, sourceType)
          resolve(`Import ${sourceType} réussi`)
        } catch (error) {
          reject(`Erreur import ${sourceType}: ${error.message}`)
        }
      }
      
      reader.onerror = () => reject('Erreur lecture fichier')
      reader.readAsText(file)
    })
  },

  // Exporter les données (équivalent sauvegarde Excel)
  exportData: (format = 'csv') => {
    try {
      excelEmulator.macros.exportToExcel()
      return 'Export réussi'
    } catch (error) {
      throw new Error(`Erreur export: ${error.message}`)
    }
  },

  // Synchroniser avec les données externes (équivalent liaisons Excel)
  syncExternal: async (apiEndpoint) => {
    try {
      const response = await fetch(apiEndpoint)
      const data = await response.json()
      
      // Traiter les données externes
      data.forEach(item => {
        const existingVRID = logisticsStore.store.vridData.find(v => v.vrid === item.vrid)
        if (existingVRID) {
          // Mise à jour
          Object.assign(existingVRID, item, { updatedAt: new Date() })
        } else {
          // Nouveau VRID
          logisticsStore.store.vridData.push({
            ...item,
            id: Date.now() + Math.random(),
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      })
      
      excelEmulator.macros.refreshData()
      return `Synchronisation réussie: ${data.length} éléments`
      
    } catch (error) {
      throw new Error(`Erreur synchronisation: ${error.message}`)
    }
  }
}

// Export par défaut
export default {
  excelEmulator,
  excelSync,
  CONFIG_EXCEL
}