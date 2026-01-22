import { reactive, ref, computed } from 'vue'
import logisticsStore, { logisticsActions } from './logisticsStore.js'

// Configuration spécifique pour chaque type d'import
export const IMPORT_CONFIG = {
  AFT: {
    name: 'ImportCSVToAFTV3',
    sheetName: 'AFT',
    cleanBeforeImport: true,
    createFormattedTable: true,
    expectedColumns: ['VRID', 'Statut', 'Pallets', 'BT', 'Units', 'SBD', 'YMS_Arrival', 'Location'],
    dataMapping: {
      'VRID': 'vrid',
      'Statut': 'statut', 
      'Status': 'statut',
      'Pallets': 'pallets',
      'Pallet': 'pallets',
      'BT': 'bt',
      'Units': 'units',
      'Unit': 'units',
      'SBD': 'sbd',
      'YMS_Arrival': 'ymsArrivalTime',
      'YMS Arrival': 'ymsArrivalTime',
      'Arrival': 'ymsArrivalTime',
      'Location': 'location',
      'Loc': 'location'
    },
    defaultValues: {
      fcSource: 'AFT-SYSTEM',
      priority: 'MEDIUM',
      statut: 'IN PROGRESS'
    }
  },
  
  FMC_V3: {
    name: 'VRID_FMC_du_jourV3',
    sheetName: 'FMC',
    cleanBeforeImport: true,
    readLineByLine: true,
    formatData: true,
    expectedColumns: ['VRID', 'Statut', 'Pallets', 'BT', 'Units', 'Location', 'Remorques', 'Priority'],
    dataMapping: {
      'VRID': 'vrid',
      'Statut': 'statut',
      'Status': 'statut',
      'Pallets': 'pallets',
      'BT': 'bt', 
      'Units': 'units',
      'Location': 'location',
      'Remorques': 'remorques',
      'Trailer': 'remorques',
      'Priority': 'priority',
      'Priorite': 'priority',
      'SBD': 'sbd',
      'YMS_Arrival': 'ymsArrivalTime'
    },
    defaultValues: {
      fcSource: 'FMC-SYSTEM',
      priority: 'MEDIUM',
      statut: 'VRAC'
    }
  },
  
  FMC_V4: {
    name: 'VRID_FMC_du_jourV4',
    sheetName: 'Dashboard',
    targetColumn: 'J', // Copie vers colonne J du Dashboard
    countImported: true,
    specificToDay: true,
    expectedColumns: ['VRID', 'Date', 'Priority'],
    dataMapping: {
      'VRID': 'vrid',
      'Date': 'importDate',
      'Priority': 'priority',
      'Priorite': 'priority'
    },
    defaultValues: {
      fcSource: 'FMC-SYSTEM',
      importDate: new Date(),
      statut: 'IN PROGRESS'
    }
  }
}

// Store spécialisé pour les imports
export const importStore = reactive({
  // Données par type d'import
  aftData: [],
  fmcData: [],
  dashboardVRIDs: [],
  
  // États des imports
  importStates: {
    AFT: { isImporting: false, lastImport: null, recordCount: 0 },
    FMC_V3: { isImporting: false, lastImport: null, recordCount: 0 },
    FMC_V4: { isImporting: false, lastImport: null, recordCount: 0 }
  },
  
  // Historique des imports
  importHistory: JSON.parse(localStorage.getItem('importHistory') || '[]'),
  
  // Statistiques globales
  totalImports: 0,
  totalRecords: 0,
  lastSyncTime: null
})

// Actions d'import spécialisées
export const importActions = {
  
  // ===== IMPORT AFT (ImportCSVToAFTV3) =====
  async importAFTData(file) {
    const startTime = Date.now()
    importStore.importStates.AFT.isImporting = true
    
    try {
      console.log('🚀 Démarrage ImportCSVToAFTV3...')
      
      // 1. Nettoyage automatique de la feuille AFT
      this.cleanAFTSheet()
      
      // 2. Lecture du fichier CSV
      const csvContent = await this.readFileContent(file)
      
      // 3. Parsing avec configuration AFT
      const parsedData = this.parseCSVWithConfig(csvContent, IMPORT_CONFIG.AFT)
      
      // 4. Validation des données AFT
      const validatedData = this.validateImportData(parsedData, 'AFT')
      
      // 5. Création du tableau formaté
      const formattedTable = this.createFormattedTable(validatedData, 'AFT')
      
      // 6. Stockage des données AFT
      importStore.aftData = formattedTable
      
      // 7. Mise à jour automatique des données principales
      this.updateMainDataFromAFT(formattedTable)
      
      // 8. Enregistrement de l'import
      this.recordImport('AFT', {
        recordsProcessed: formattedTable.length,
        processingTime: Date.now() - startTime,
        status: 'success'
      })
      
      console.log(`✅ ImportCSVToAFTV3 terminé: ${formattedTable.length} enregistrements`)
      return { success: true, records: formattedTable.length }
      
    } catch (error) {
      console.error('❌ Erreur ImportCSVToAFTV3:', error)
      this.recordImport('AFT', {
        recordsProcessed: 0,
        processingTime: Date.now() - startTime,
        status: 'error',
        error: error.message
      })
      throw error
    } finally {
      importStore.importStates.AFT.isImporting = false
    }
  },

  // ===== IMPORT FMC V3 (VRID_FMC_du_jourV3) =====
  async importFMCV3Data(file) {
    const startTime = Date.now()
    importStore.importStates.FMC_V3.isImporting = true
    
    try {
      console.log('🚀 Démarrage VRID_FMC_du_jourV3...')
      
      // 1. Nettoyage complet de la feuille FMC
      this.cleanFMCSheet()
      
      // 2. Lecture du fichier CSV
      const csvContent = await this.readFileContent(file)
      
      // 3. Lecture ligne par ligne (spécificité V3)
      const lineByLineData = this.readCSVLineByLine(csvContent, IMPORT_CONFIG.FMC_V3)
      
      // 4. Formatage des données (spécificité V3)
      const formattedData = this.formatFMCData(lineByLineData)
      
      // 5. Validation FMC
      const validatedData = this.validateImportData(formattedData, 'FMC_V3')
      
      // 6. Stockage des données FMC
      importStore.fmcData = validatedData
      
      // 7. Mise à jour des données principales
      this.updateMainDataFromFMC(validatedData)
      
      // 8. Enregistrement de l'import
      this.recordImport('FMC_V3', {
        recordsProcessed: validatedData.length,
        processingTime: Date.now() - startTime,
        status: 'success'
      })
      
      console.log(`✅ VRID_FMC_du_jourV3 terminé: ${validatedData.length} enregistrements`)
      return { success: true, records: validatedData.length }
      
    } catch (error) {
      console.error('❌ Erreur VRID_FMC_du_jourV3:', error)
      this.recordImport('FMC_V3', {
        recordsProcessed: 0,
        processingTime: Date.now() - startTime,
        status: 'error',
        error: error.message
      })
      throw error
    } finally {
      importStore.importStates.FMC_V3.isImporting = false
    }
  },

  // ===== IMPORT FMC V4 (VRID_FMC_du_jourV4) =====
  async importFMCV4Data(file) {
    const startTime = Date.now()
    importStore.importStates.FMC_V4.isImporting = true
    
    try {
      console.log('🚀 Démarrage VRID_FMC_du_jourV4...')
      
      // 1. Lecture du fichier CSV
      const csvContent = await this.readFileContent(file)
      
      // 2. Parsing spécifique aux VRID du jour
      const todayVRIDs = this.parseTodayVRIDs(csvContent, IMPORT_CONFIG.FMC_V4)
      
      // 3. Validation des VRID du jour
      const validatedVRIDs = this.validateTodayVRIDs(todayVRIDs)
      
      // 4. Copie des VRID vers la colonne J du Dashboard
      this.copyVRIDsToDashboardColumnJ(validatedVRIDs)
      
      // 5. Comptage des VRID importés
      const importCount = this.countImportedVRIDs(validatedVRIDs)
      
      // 6. Stockage dans le Dashboard
      importStore.dashboardVRIDs = validatedVRIDs
      
      // 7. Enregistrement de l'import
      this.recordImport('FMC_V4', {
        recordsProcessed: importCount,
        processingTime: Date.now() - startTime,
        status: 'success',
        specificInfo: `${importCount} VRID du jour copiés en colonne J`
      })
      
      console.log(`✅ VRID_FMC_du_jourV4 terminé: ${importCount} VRID du jour`)
      return { success: true, records: importCount, dashboardUpdated: true }
      
    } catch (error) {
      console.error('❌ Erreur VRID_FMC_du_jourV4:', error)
      this.recordImport('FMC_V4', {
        recordsProcessed: 0,
        processingTime: Date.now() - startTime,
        status: 'error',
        error: error.message
      })
      throw error
    } finally {
      importStore.importStates.FMC_V4.isImporting = false
    }
  },

  // ===== FONCTIONS UTILITAIRES =====
  
  // Nettoyage automatique feuille AFT
  cleanAFTSheet() {
    console.log('🧹 Nettoyage automatique feuille AFT...')
    importStore.aftData = []
    // Simulation nettoyage équivalent à Range.Clear en VBA
    console.log('✅ Feuille AFT nettoyée')
  },

  // Nettoyage complet feuille FMC
  cleanFMCSheet() {
    console.log('🧹 Nettoyage complet feuille FMC...')
    importStore.fmcData = []
    console.log('✅ Feuille FMC nettoyée')
  },

  // Lecture du contenu du fichier
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log(`📖 Fichier lu: ${file.name} (${file.size} bytes)`)
        resolve(e.target.result)
      }
      reader.onerror = () => reject(new Error('Erreur lecture fichier'))
      reader.readAsText(file, 'UTF-8')
    })
  },

  // Parsing CSV avec configuration spécifique
  parseCSVWithConfig(csvContent, config) {
    console.log(`🔍 Parsing CSV avec config ${config.name}...`)
    
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('Fichier CSV vide ou invalide')
    }

    // Détection des headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    console.log('📋 Headers détectés:', headers)

    // Vérification des colonnes attendues
    const missingColumns = config.expectedColumns.filter(col => 
      !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
    )
    
    if (missingColumns.length > 0) {
      console.warn('⚠️ Colonnes manquantes:', missingColumns)
    }

    // Parsing des données
    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length !== headers.length) continue

      const row = {}
      headers.forEach((header, index) => {
        const mappedField = config.dataMapping[header] || header.toLowerCase()
        row[mappedField] = values[index]
      })

      // Application des valeurs par défaut
      Object.assign(row, config.defaultValues, row)
      data.push(row)
    }

    console.log(`✅ ${data.length} lignes parsées`)
    return data
  },

  // Parsing ligne CSV (gestion des guillemets et virgules)
  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  },

  // Lecture ligne par ligne (spécifique FMC V3)
  readCSVLineByLine(csvContent, config) {
    console.log('📖 Lecture ligne par ligne (FMC V3)...')
    
    const lines = csvContent.split('\n')
    const processedData = []
    
    // Headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    // Traitement ligne par ligne avec logging
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      
      console.log(`📝 Traitement ligne ${i}: ${lines[i].substring(0, 50)}...`)
      
      const values = this.parseCSVLine(lines[i])
      const row = {}
      
      headers.forEach((header, index) => {
        const mappedField = config.dataMapping[header] || header.toLowerCase()
        row[mappedField] = values[index] || ''
      })
      
      Object.assign(row, config.defaultValues, row)
      processedData.push(row)
    }
    
    return processedData
  },

  // Formatage spécifique des données FMC
  formatFMCData(rawData) {
    console.log('🎨 Formatage des données FMC...')
    
    return rawData.map(row => {
      // Normalisation des données FMC
      const formatted = {
        ...row,
        pallets: this.parseNumber(row.pallets),
        bt: this.parseNumber(row.bt),
        units: this.parseNumber(row.units),
        sbd: this.parseDate(row.sbd) || new Date(),
        ymsArrivalTime: this.parseDate(row.ymsArrivalTime) || new Date(),
        priority: (row.priority || 'MEDIUM').toUpperCase(),
        statut: (row.statut || 'VRAC').toUpperCase(),
        location: row.location || 'ZONE_VRAC',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      return formatted
    })
  },

  // Parsing spécifique VRID du jour (FMC V4)
  parseTodayVRIDs(csvContent, config) {
    console.log('📅 Parsing VRID du jour (FMC V4)...')
    
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    const todayVRIDs = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      const row = {}
      
      headers.forEach((header, index) => {
        const mappedField = config.dataMapping[header] || header.toLowerCase()
        row[mappedField] = values[index]
      })
      
      // Filtrage des VRID du jour
      const rowDate = this.parseDate(row.importDate || row.date)
      if (rowDate && rowDate.toISOString().split('T')[0] === todayString) {
        Object.assign(row, config.defaultValues, row)
        todayVRIDs.push(row)
      }
    }
    
    console.log(`✅ ${todayVRIDs.length} VRID du jour identifiés`)
    return todayVRIDs
  },

  // Copie vers colonne J du Dashboard
  copyVRIDsToDashboardColumnJ(vrids) {
    console.log('📋 Copie des VRID vers colonne J du Dashboard...')
    
    // Simulation de la copie en colonne J
    const dashboardColumn = vrids.map((vrid, index) => ({
      row: index + 2, // Ligne 2+ (après header)
      column: 'J',
      value: vrid.vrid,
      priority: vrid.priority,
      importDate: vrid.importDate
    }))
    
    // Stockage dans le store
    importStore.dashboardVRIDs = dashboardColumn
    
    console.log(`✅ ${dashboardColumn.length} VRID copiés en colonne J`)
    return dashboardColumn
  },

  // Comptage des VRID importés
  countImportedVRIDs(vrids) {
    const count = vrids.length
    console.log(`🔢 Nombre de VRID importés: ${count}`)
    
    // Mise à jour des statistiques
    importStore.importStates.FMC_V4.recordCount = count
    
    return count
  },

  // Création de tableau formaté (AFT)
  createFormattedTable(data, type) {
    console.log(`🎨 Création tableau formaté pour ${type}...`)
    
    const formattedTable = data.map((row, index) => ({
      ...row,
      id: Date.now() + index,
      rowNumber: index + 2, // Excel commence à la ligne 2
      isFormatted: true,
      tableType: type,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    
    console.log(`✅ Tableau formaté créé: ${formattedTable.length} lignes`)
    return formattedTable
  },

  // Validation des données d'import
  validateImportData(data, importType) {
    console.log(`✅ Validation des données ${importType}...`)
    
    const validatedData = data.map(row => {
      const validation = {
        isValid: true,
        errors: [],
        warnings: []
      }
      
      // Validation VRID
      if (!row.vrid || row.vrid.length < 3) {
        validation.errors.push('VRID manquant ou invalide')
        validation.isValid = false
      }
      
      // Validation valeurs numériques
      if (row.pallets < 0 || row.bt < 0 || row.units < 0) {
        validation.errors.push('Valeurs numériques négatives')
        validation.isValid = false
      }
      
      // Validation statut
      const validStatuses = ['IN PROGRESS', 'VRAC', 'PALETTIZED', 'DONE']
      if (!validStatuses.includes(row.statut)) {
        validation.warnings.push('Statut non standard')
      }
      
      return {
        ...row,
        validation: validation
      }
    })
    
    const validCount = validatedData.filter(r => r.validation.isValid).length
    const errorCount = validatedData.length - validCount
    
    console.log(`✅ Validation terminée: ${validCount} valides, ${errorCount} erreurs`)
    return validatedData
  },

  // Validation spécifique VRID du jour
  validateTodayVRIDs(vrids) {
    console.log('✅ Validation VRID du jour...')
    
    const today = new Date().toISOString().split('T')[0]
    
    return vrids.filter(vrid => {
      const vridDate = this.parseDate(vrid.importDate)
      return vridDate && vridDate.toISOString().split('T')[0] === today
    })
  },

  // Mise à jour des données principales depuis AFT
  updateMainDataFromAFT(aftData) {
    console.log('🔄 Mise à jour données principales depuis AFT...')
    
    aftData.forEach(aftRow => {
      if (!aftRow.validation || !aftRow.validation.isValid) return
      
      const existingIndex = logisticsStore.store.vridData.findIndex(
        v => v.vrid === aftRow.vrid
      )
      
      const mainVRID = {
        id: existingIndex >= 0 ? logisticsStore.store.vridData[existingIndex].id : Date.now() + Math.random(),
        vrid: aftRow.vrid,
        statut: aftRow.statut,
        pallets: this.parseNumber(aftRow.pallets),
        bt: this.parseNumber(aftRow.bt),
        units: this.parseNumber(aftRow.units),
        sbd: this.parseDate(aftRow.sbd) || new Date(),
        ymsArrivalTime: this.parseDate(aftRow.ymsArrivalTime) || new Date(),
        location: aftRow.location || 'QUEUE',
        remorques: aftRow.remorques || '',
        priority: aftRow.priority || 'MEDIUM',
        fcSource: 'AFT-SYSTEM',
        statutDetaille: aftRow.statutDetaille || '',
        createdAt: existingIndex >= 0 ? logisticsStore.store.vridData[existingIndex].createdAt : new Date(),
        updatedAt: new Date()
      }
      
      if (existingIndex >= 0) {
        logisticsStore.store.vridData[existingIndex] = mainVRID
      } else {
        logisticsStore.store.vridData.push(mainVRID)
      }
    })
    
    logisticsActions.updateMetrics()
    console.log('✅ Données principales mises à jour depuis AFT')
  },

  // Mise à jour des données principales depuis FMC
  updateMainDataFromFMC(fmcData) {
    console.log('🔄 Mise à jour données principales depuis FMC...')
    
    fmcData.forEach(fmcRow => {
      if (!fmcRow.validation || !fmcRow.validation.isValid) return
      
      const existingIndex = logisticsStore.store.vridData.findIndex(
        v => v.vrid === fmcRow.vrid
      )
      
      const mainVRID = {
        id: existingIndex >= 0 ? logisticsStore.store.vridData[existingIndex].id : Date.now() + Math.random(),
        vrid: fmcRow.vrid,
        statut: fmcRow.statut,
        pallets: this.parseNumber(fmcRow.pallets),
        bt: this.parseNumber(fmcRow.bt),
        units: this.parseNumber(fmcRow.units),
        sbd: this.parseDate(fmcRow.sbd) || new Date(),
        ymsArrivalTime: this.parseDate(fmcRow.ymsArrivalTime) || new Date(),
        location: fmcRow.location || 'ZONE_VRAC',
        remorques: fmcRow.remorques || '',
        priority: fmcRow.priority || 'MEDIUM',
        fcSource: 'FMC-SYSTEM',
        statutDetaille: fmcRow.statutDetaille || '',
        createdAt: existingIndex >= 0 ? logisticsStore.store.vridData[existingIndex].createdAt : new Date(),
        updatedAt: new Date()
      }
      
      if (existingIndex >= 0) {
        logisticsStore.store.vridData[existingIndex] = mainVRID
      } else {
        logisticsStore.store.vridData.push(mainVRID)
      }
    })
    
    logisticsActions.updateMetrics()
    console.log('✅ Données principales mises à jour depuis FMC')
  },

  // Synchronisation post-import
  async synchronizeAfterImport(importType) {
    console.log(`🔄 Synchronisation post-import ${importType}...`)
    
    // 1. Mise à jour des listes déroulantes
    await this.updateDropdownLists()
    
    // 2. Synchronisation entre onglets
    await this.synchronizeBetweenSheets()
    
    // 3. MAJ des statuts et informations connexes
    await this.updateStatusAndRelatedInfo()
    
    // 4. Mise à jour du timestamp de synchronisation
    importStore.lastSyncTime = new Date()
    
    console.log('✅ Synchronisation post-import terminée')
  },

  // Mise à jour des listes déroulantes
  updateDropdownLists() {
    console.log('📋 Mise à jour des listes déroulantes...')
    
    // Extraction des valeurs uniques pour les dropdowns
    const allVRIDs = logisticsStore.store.vridData
    
    const uniqueLocations = [...new Set(allVRIDs.map(v => v.location).filter(Boolean))]
    const uniqueStatuses = [...new Set(allVRIDs.map(v => v.statut).filter(Boolean))]
    const uniquePriorities = [...new Set(allVRIDs.map(v => v.priority).filter(Boolean))]
    
    // Mise à jour du store avec les nouvelles listes
    logisticsStore.store.dropdownLists = {
      locations: uniqueLocations,
      statuses: uniqueStatuses,
      priorities: uniquePriorities,
      lastUpdated: new Date()
    }
    
    console.log('✅ Listes déroulantes mises à jour')
  },

  // Synchronisation entre feuilles/onglets
  synchronizeBetweenSheets() {
    console.log('🔄 Synchronisation entre onglets...')
    
    // Synchronisation AFT → Main
    importStore.aftData.forEach(aftItem => {
      const mainItem = logisticsStore.store.vridData.find(v => v.vrid === aftItem.vrid)
      if (mainItem && aftItem.validation?.isValid) {
        mainItem.lastAFTUpdate = new Date()
        mainItem.aftData = aftItem
      }
    })
    
    // Synchronisation FMC → Main
    importStore.fmcData.forEach(fmcItem => {
      const mainItem = logisticsStore.store.vridData.find(v => v.vrid === fmcItem.vrid)
      if (mainItem && fmcItem.validation?.isValid) {
        mainItem.lastFMCUpdate = new Date()
        mainItem.fmcData = fmcItem
      }
    })
    
    console.log('✅ Synchronisation entre onglets terminée')
  },

  // MAJ statuts et informations connexes
  updateStatusAndRelatedInfo() {
    console.log('📊 MAJ statuts et informations connexes...')
    
    // Mise à jour des métriques
    logisticsActions.updateMetrics()
    
    // Mise à jour du backlog
    logisticsActions.updateBacklog()
    
    // Recalcul des positions FIFO
    logisticsActions.sortVRIDByFIFO()
    
    // Mise à jour des temps restants
    logisticsActions.updateTimeRemaining()
    
    console.log('✅ Statuts et informations connexes mis à jour')
  },

  // Enregistrement de l'import dans l'historique
  recordImport(type, details) {
    const importRecord = {
      id: Date.now(),
      type: type,
      timestamp: new Date(),
      ...details
    }
    
    importStore.importHistory.unshift(importRecord)
    
    // Limitation à 100 entrées
    if (importStore.importHistory.length > 100) {
      importStore.importHistory = importStore.importHistory.slice(0, 100)
    }
    
    // Sauvegarde locale
    localStorage.setItem('importHistory', JSON.stringify(importStore.importHistory))
    
    // Mise à jour des statistiques
    importStore.totalImports++
    importStore.totalRecords += details.recordsProcessed || 0
    importStore.importStates[type].lastImport = new Date()
    importStore.importStates[type].recordCount = details.recordsProcessed || 0
    
    console.log(`📝 Import ${type} enregistré dans l'historique`)
  },

  // Fonctions utilitaires
  parseNumber(value) {
    const num = parseInt(value) || 0
    return num < 0 ? 0 : num
  },

  parseDate(dateStr) {
    if (!dateStr) return null
    
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  }
}

// Export par défaut
export default {
  importStore,
  importActions,
  IMPORT_CONFIG
}