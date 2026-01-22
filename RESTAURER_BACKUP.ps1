# SCRIPT DE RESTAURATION - FluxInboundDock
# ========================================
# Ce script restaure une sauvegarde en cas de problème

$sourceDir = "c:\Users\kahlh\Desktop\FluxInboundDock"
$backupsDir = "$sourceDir\BACKUPS"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔄 RESTAURATION FLUXINBOUNDDOCK" -ForegroundColor Yellow  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Lister les sauvegardes disponibles
if (Test-Path $backupsDir) {
    $backups = Get-ChildItem $backupsDir -Directory | Sort-Object Name -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "❌ Aucune sauvegarde trouvée dans $backupsDir" -ForegroundColor Red
        Write-Host "Appuyez sur une touche pour quitter..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }
    
    Write-Host "📂 SAUVEGARDES DISPONIBLES:" -ForegroundColor Green
    Write-Host ""
    
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $backup = $backups[$i]
        $readmePath = Join-Path $backup.FullName "README_BACKUP.txt"
        $info = ""
        
        if (Test-Path $readmePath) {
            $content = Get-Content $readmePath -Raw
            if ($content -match "Date: (.+)") {
                $info = " - $($matches[1])"
            }
        }
        
        Write-Host "$($i + 1). $($backup.Name)$info" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "0. Annuler" -ForegroundColor Red
    Write-Host ""
    
    do {
        $choice = Read-Host "Choisissez une sauvegarde à restaurer (0-$($backups.Count))"
        $choiceNum = [int]$choice
    } while ($choiceNum -lt 0 -or $choiceNum -gt $backups.Count)
    
    if ($choiceNum -eq 0) {
        Write-Host "❌ Restauration annulée" -ForegroundColor Yellow
        Write-Host "Appuyez sur une touche pour quitter..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }
    
    $selectedBackup = $backups[$choiceNum - 1]
    $backupPath = $selectedBackup.FullName
    
    Write-Host ""
    Write-Host "🔄 Restauration en cours depuis: $($selectedBackup.Name)" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # Créer un backup de la version actuelle avant restauration
        $emergencyBackup = "$sourceDir\BACKUPS\EMERGENCY_BEFORE_RESTORE_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
        New-Item -ItemType Directory -Path $emergencyBackup -Force | Out-Null
        
        if (Test-Path "$sourceDir\flux-sections-excel-style.html") {
            Copy-Item "$sourceDir\flux-sections-excel-style.html" $emergencyBackup -Force
            Write-Host "💾 Version actuelle sauvegardée en urgence" -ForegroundColor Cyan
        }
        
        # Restaurer les fichiers
        $filesToRestore = Get-ChildItem $backupPath -File | Where-Object { $_.Name -ne "README_BACKUP.txt" }
        $restoredCount = 0
        
        foreach ($file in $filesToRestore) {
            $destPath = Join-Path $sourceDir $file.Name
            Copy-Item $file.FullName $destPath -Force
            Write-Host "✅ $($file.Name) restauré" -ForegroundColor Green
            $restoredCount++
        }
        
        Write-Host ""
        Write-Host "🎉 RESTAURATION TERMINÉE AVEC SUCCÈS!" -ForegroundColor Green
        Write-Host "📊 $restoredCount fichiers restaurés" -ForegroundColor Green
        Write-Host "💾 Version précédente sauvée dans: EMERGENCY_BEFORE_RESTORE_*" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 CONSEIL: Testez le site pour vérifier que tout fonctionne!" -ForegroundColor Yellow
        
    } catch {
        Write-Host ""
        Write-Host "❌ ERREUR lors de la restauration:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Dossier de sauvegardes non trouvé: $backupsDir" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")