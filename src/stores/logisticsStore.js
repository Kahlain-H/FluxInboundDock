// Store central pour la gestion des données logistiques
// Remplace les fonctions VBA de votre Excel

import { reactive, computed } from 'vue'

// Configuration des statuts et locations (comme vos listes VBA)
export const CONFIG = {
  STATUTS: {
    IN_PROGRESS: 'IN PROGRESS',
    VRAC: 'VRAC', 
    PALETTIZED: 'PALETTIZED',
    DONE: 'DONE'
  },
  LOCATIONS: {
    QUAI: ['DOCK-A1', 'DOCK-A2', 'DOCK-B1', 'DOCK-B2', 'DOCK-C1', 'DOCK-C2'],
    STOCK: ['STOCK-Z1', 'STOCK-Z2', 'STOCK-Z3'],
    QUEUE: ['QUEUE-1', 'QUEUE-2', 'QUEUE-3']
  },
  PRIORITIES: {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM', 
    LOW: 'LOW'
  }
}

// Store principal (équivalent de vos variables globales VBA)
export const logisticsStore = reactive({
  // Données principales (comme votre feuille Excel)
  vridData: [
    {
      id: 1,
      vrid: 'VR240001',
      statut: CONFIG.STATUTS.IN_PROGRESS,
      pallets: 24,
      bt: 8,
      units: 1200,
      sbd: new Date('2024-10-27T08:30:00'),
      ymsArrivalTime: new Date('2024-10-27T07:45:00'),
      location: 'DOCK-A1',
      remorques: 'TR-001',
      statutDetaille: 'Déchargement en cours',
      fcSource: 'AFT-SYSTEM',
      priority: CONFIG.PRIORITIES.HIGH,
      createdAt: new Date('2024-10-27T07:45:00'),
      updatedAt: new Date(),
      timeRemaining: null, // Calculé automatiquement
      backlogPosition: null
    },
    {
      id: 2,
      vrid: 'VR240002',
      statut: CONFIG.STATUTS.VRAC,
      pallets: 0,
      bt: 15,
      units: 850,
      sbd: new Date('2024-10-27T09:15:00'),
      ymsArrivalTime: new Date('2024-10-27T08:30:00'),
      location: 'DOCK-B2',
      remorques: 'TR-005',
      statutDetaille: 'Marchandise en vrac',
      fcSource: 'FMC-SYSTEM',
      priority: CONFIG.PRIORITIES.MEDIUM,
      createdAt: new Date('2024-10-27T08:30:00'),
      updatedAt: new Date(),
      timeRemaining: null,
      backlogPosition: null
    },
    {
      id: 3,
      vrid: 'VR240003',
      statut: CONFIG.STATUTS.PALETTIZED,
      pallets: 18,
      bt: 6,
      units: 900,
      sbd: new Date('2024-10-27T10:00:00'),
      ymsArrivalTime: new Date('2024-10-27T09:15:00'),
      location: 'DOCK-C3',
      remorques: 'TR-012',
      statutDetaille: 'Palettisation terminée',
      fcSource: 'SKYNET',
      priority: CONFIG.PRIORITIES.LOW,
      createdAt: new Date('2024-10-27T09:15:00'),
      updatedAt: new Date(),
      timeRemaining: null,
      backlogPosition: null
    },
    {
      id: 4,
      vrid: 'VR240004',
      statut: CONFIG.STATUTS.DONE,
      pallets: 32,
      bt: 10,
      units: 1600,
      sbd: new Date('2024-10-27T06:00:00'),
      ymsArrivalTime: new Date('2024-10-27T05:30:00'),
      location: 'STOCK-Z1',
      remorques: 'TR-008',
      statutDetaille: 'Traitement terminé',
      fcSource: 'AFT-SYSTEM',
      priority: CONFIG.PRIORITIES.LOW,
      createdAt: new Date('2024-10-27T05:30:00'),
      updatedAt: new Date(),
      timeRemaining: null,
      backlogPosition: null
    }
  ],

  // Métriques calculées (équivalent de vos formules Excel)
  metrics: {
    totalPallets: 0,
    totalBT: 0,
    totalUnits: 0,
    totalVRID: 0,
    statusCounts: {
      [CONFIG.STATUTS.IN_PROGRESS]: 0,
      [CONFIG.STATUTS.VRAC]: 0,
      [CONFIG.STATUTS.PALETTIZED]: 0,
      [CONFIG.STATUTS.DONE]: 0
    },
    averageProcessingTime: 0,
    backlogCount: 0
  },

  // Alertes et notifications
  alerts: [],
  
  // Configuration système
  settings: {
    autoRefresh: true,
    refreshInterval: 5000,
    maxProcessingTime: 4 * 60 * 60 * 1000, // 4 heures en ms
    fifoSorting: true
  }
})

// Fonctions équivalentes à vos macros VBA
export const logisticsActions = {
  
  // Équivalent de votre macro de déplacement VBA
  moveVRIDStatus(vridId, newStatus, newLocation = null) {
    const vrid = logisticsStore.vridData.find(v => v.id === vridId)
    if (!vrid) {
      console.error('VRID not found:', vridId)
      return false
    }

    // Validation des transitions (comme vos conditions VBA)
    const validTransitions = {
      [CONFIG.STATUTS.IN_PROGRESS]: [CONFIG.STATUTS.DONE, CONFIG.STATUTS.VRAC],
      [CONFIG.STATUTS.VRAC]: [CONFIG.STATUTS.PALETTIZED, CONFIG.STATUTS.DONE],
      [CONFIG.STATUTS.PALETTIZED]: [CONFIG.STATUTS.DONE],
      [CONFIG.STATUTS.DONE]: [] // Terminal
    }

    if (!validTransitions[vrid.statut].includes(newStatus)) {
      this.addAlert({
        type: 'error',
        message: `Transition invalide: ${vrid.statut} → ${newStatus}`,
        vridId: vridId
      })
      return false
    }

    // Effectuer le déplacement
    const oldStatus = vrid.statut
    vrid.statut = newStatus
    vrid.updatedAt = new Date()
    
    // Gestion des emplacements (équivalent de votre logique VBA)
    if (newLocation) {
      vrid.location = newLocation
    } else {
      // Auto-assignation selon le statut (comme vos règles VBA)
      vrid.location = this.getDefaultLocation(newStatus)
    }

    // Mise à jour du statut détaillé
    vrid.statutDetaille = this.getStatusDetails(newStatus)

    // Log de l'action (équivalent de vos traces VBA)
    console.log(`VRID ${vrid.vrid}: ${oldStatus} → ${newStatus}`)
    
    this.addAlert({
      type: 'success',
      message: `VRID ${vrid.vrid} déplacé vers ${newStatus}`,
      vridId: vridId
    })

    // Recalculer les métriques
    this.updateMetrics()
    this.updateBacklog()
    
    return true
  },

  // Équivalent de votre fonction de tri FIFO VBA
  sortVRIDByFIFO() {
    if (!logisticsStore.settings.fifoSorting) return

    logisticsStore.vridData.sort((a, b) => {
      // Tri par priorité puis par date (comme votre tri VBA)
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      
      // Puis par date d'arrivée YMS
      return a.ymsArrivalTime - b.ymsArrivalTime
    })

    this.updateBacklogPositions()
  },

  // Gestion des emplacements vides (équivalent VBA)
  getAvailableLocations(statusType = 'QUAI') {
    const occupiedLocations = logisticsStore.vridData
      .filter(v => v.statut !== CONFIG.STATUTS.DONE)
      .map(v => v.location)
    
    return CONFIG.LOCATIONS[statusType].filter(loc => !occupiedLocations.includes(loc))
  },

  // Attribution automatique de location (comme vos règles VBA)
  getDefaultLocation(status) {
    switch (status) {
      case CONFIG.STATUTS.IN_PROGRESS:
        return this.getAvailableLocations('QUAI')[0] || 'QUEUE-1'
      case CONFIG.STATUTS.VRAC:
      case CONFIG.STATUTS.PALETTIZED:
        return this.getAvailableLocations('QUAI')[0] || 'DOCK-A1'
      case CONFIG.STATUTS.DONE:
        return this.getAvailableLocations('STOCK')[0] || 'STOCK-Z1'
      default:
        return 'QUEUE-1'
    }
  },

  // Détails du statut (équivalent de vos descriptions VBA)
  getStatusDetails(status) {
    const details = {
      [CONFIG.STATUTS.IN_PROGRESS]: 'Traitement en cours',
      [CONFIG.STATUTS.VRAC]: 'Marchandise en vrac - Palettisation requise',
      [CONFIG.STATUTS.PALETTIZED]: 'Palettisation terminée - Prêt stockage',
      [CONFIG.STATUTS.DONE]: 'Traitement terminé - Stocké'
    }
    return details[status] || 'Statut inconnu'
  },

  // Calcul des métriques (équivalent de vos formules Excel)
  updateMetrics() {
    const data = logisticsStore.vridData
    
    logisticsStore.metrics.totalVRID = data.length
    logisticsStore.metrics.totalPallets = data.reduce((sum, v) => sum + v.pallets, 0)
    logisticsStore.metrics.totalBT = data.reduce((sum, v) => sum + v.bt, 0)
    logisticsStore.metrics.totalUnits = data.reduce((sum, v) => sum + v.units, 0)
    
    // Comptage par statut
    Object.keys(CONFIG.STATUTS).forEach(key => {
      const status = CONFIG.STATUTS[key]
      logisticsStore.metrics.statusCounts[status] = 
        data.filter(v => v.statut === status).length
    })

    // Temps de traitement moyen
    const completedVRIDs = data.filter(v => v.statut === CONFIG.STATUTS.DONE)
    if (completedVRIDs.length > 0) {
      const totalTime = completedVRIDs.reduce((sum, v) => {
        return sum + (v.updatedAt - v.createdAt)
      }, 0)
      logisticsStore.metrics.averageProcessingTime = totalTime / completedVRIDs.length
    }
  },

  // Gestion du backlog (équivalent de votre calcul VBA)
  updateBacklog() {
    const activeVRIDs = logisticsStore.vridData
      .filter(v => v.statut !== CONFIG.STATUTS.DONE)
      .sort((a, b) => a.ymsArrivalTime - b.ymsArrivalTime)
    
    logisticsStore.metrics.backlogCount = activeVRIDs.length
    
    // Mise à jour des positions dans le backlog
    activeVRIDs.forEach((vrid, index) => {
      vrid.backlogPosition = index + 1
    })
  },

  // Calcul du temps restant (équivalent de votre timer VBA)
  updateTimeRemaining() {
    const now = new Date()
    
    logisticsStore.vridData.forEach(vrid => {
      if (vrid.statut !== CONFIG.STATUTS.DONE) {
        const elapsedTime = now - vrid.createdAt
        const maxTime = logisticsStore.settings.maxProcessingTime
        vrid.timeRemaining = Math.max(0, maxTime - elapsedTime)
        
        // Alerte si dépassement (comme votre condition VBA)
        if (vrid.timeRemaining === 0 && !this.hasAlert(vrid.id, 'timeout')) {
          this.addAlert({
            type: 'critical',
            message: `VRID ${vrid.vrid} dépasse le délai maximum`,
            vridId: vrid.id,
            alertType: 'timeout'
          })
        }
      }
    })
  },

  // Gestion des priorités (équivalent de votre logique VBA)
  updateVRIDPriority(vridId, newPriority) {
    const vrid = logisticsStore.vridData.find(v => v.id === vridId)
    if (vrid) {
      vrid.priority = newPriority
      vrid.updatedAt = new Date()
      this.sortVRIDByFIFO()
      this.updateBacklog()
    }
  },

  // Système d'alertes (équivalent de vos messages VBA)
  addAlert(alert) {
    logisticsStore.alerts.push({
      id: Date.now(),
      timestamp: new Date(),
      ...alert
    })
    
    // Limiter le nombre d'alertes
    if (logisticsStore.alerts.length > 50) {
      logisticsStore.alerts = logisticsStore.alerts.slice(-50)
    }
  },

  hasAlert(vridId, alertType) {
    return logisticsStore.alerts.some(a => 
      a.vridId === vridId && a.alertType === alertType
    )
  },

  // Initialisation et mises à jour automatiques (équivalent de vos timers VBA)
  startAutoUpdates() {
    if (logisticsStore.settings.autoRefresh) {
      setInterval(() => {
        this.updateTimeRemaining()
        this.updateMetrics()
        this.updateBacklog()
      }, logisticsStore.settings.refreshInterval)
    }
  },

  // Fonctions utilitaires
  findVRIDByCode(vridCode) {
    return logisticsStore.vridData.find(v => v.vrid === vridCode)
  },

  getVRIDsByStatus(status) {
    return logisticsStore.vridData.filter(v => v.statut === status)
  },

  formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }
}

// Computed properties (équivalent de vos formules Excel calculées)
export const logisticsGetters = {
  // VRIDs prioritaires (comme votre filtre VBA)
  priorityVRIDs: computed(() => {
    return logisticsStore.vridData
      .filter(v => v.statut !== CONFIG.STATUTS.DONE)
      .filter(v => v.priority === CONFIG.PRIORITIES.HIGH || v.timeRemaining === 0)
      .sort((a, b) => a.ymsArrivalTime - b.ymsArrivalTime)
  }),

  // Alertes actives
  activeAlerts: computed(() => {
    return logisticsStore.alerts
      .filter(a => a.type === 'critical' || a.type === 'warning')
      .sort((a, b) => b.timestamp - a.timestamp)
  }),

  // Locations disponibles par type
  availableLocations: computed(() => {
    const occupied = logisticsStore.vridData
      .filter(v => v.statut !== CONFIG.STATUTS.DONE)
      .map(v => v.location)
    
    return {
      QUAI: CONFIG.LOCATIONS.QUAI.filter(loc => !occupied.includes(loc)),
      STOCK: CONFIG.LOCATIONS.STOCK.filter(loc => !occupied.includes(loc)),
      QUEUE: CONFIG.LOCATIONS.QUEUE.filter(loc => !occupied.includes(loc))
    }
  })
}

// Initialisation du store
logisticsActions.updateMetrics()
logisticsActions.updateBacklog()
logisticsActions.sortVRIDByFIFO()

export default {
  store: logisticsStore,
  actions: logisticsActions,
  getters: logisticsGetters,
  config: CONFIG
}