# SCRIPT DE SAUVEGARDE AUTOMATIQUE - FluxInboundDock
# ===================================================
# Ce script crée automatiquement des sauvegardes avec timestamp
# Utilisation: Double-cliquer sur ce fichier avant chaque modification

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$sourceDir = "c:\Users\kahlh\Desktop\FluxInboundDock"
$backupDir = "$sourceDir\BACKUPS\BACKUP_$timestamp"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔒 SAUVEGARDE AUTOMATIQUE FLUXINBOUNDDOCK" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📅 Date: $(Get-Date)" -ForegroundColor Green
Write-Host "📂 Destination: $backupDir" -ForegroundColor Green
Write-Host ""

try {
    # Créer le dossier de backup
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "✅ Dossier de sauvegarde créé" -ForegroundColor Green
    
    # Liste des fichiers à sauvegarder
    $filesToBackup = @(
        "flux-sections-excel-style.html",
        "serveur-web.py", 
        "amazon-yms-proxy.py",
        "web-server.js",
        "package-web.json",
        "INSTRUCTIONS-MULTI-PC.txt",
        "MODIFICATION-AUTO-MOVE.md"
    )
    
    $backedUpCount = 0
    
    foreach ($file in $filesToBackup) {
        $sourcePath = Join-Path $sourceDir $file
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $backupDir -Force
            Write-Host "✅ $file" -ForegroundColor Green
            $backedUpCount++
        } else {
            Write-Host "⚠️  $file (non trouvé)" -ForegroundColor Yellow
        }
    }
    
    # Créer un fichier de métadonnées
    $metadata = @"
SAUVEGARDE FLUXINBOUNDDOCK
==========================
Date: $(Get-Date)
Utilisateur: $env:USERNAME
Machine: $env:COMPUTERNAME
Fichiers sauvegardés: $backedUpCount
Version: Avec contrôle Auto-Move désactivé
Status: Stable et fonctionnel

FONCTIONNALITÉS INCLUSES:
- ✅ Dashboard professionnel
- ✅ Yard Manager avec CSV
- ✅ Enrichissement croisé AFT/FMC→FluxDock  
- ✅ Contrôle déplacement automatique
- ✅ Serveur multi-PC
- ✅ Sauvegarde localStorage

RESTAURATION:
1. Copier flux-sections-excel-style.html dans le dossier principal
2. Lancer serveur-web.py pour accès multi-PC
3. Toutes les données sont préservées
"@

    $metadata | Out-File -FilePath "$backupDir\README_BACKUP.txt" -Encoding UTF8
    
    Write-Host ""
    Write-Host "🎉 SAUVEGARDE TERMINÉE AVEC SUCCÈS!" -ForegroundColor Green
    Write-Host "📊 $backedUpCount fichiers sauvegardés" -ForegroundColor Green
    Write-Host "📂 Localisation: $backupDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 CONSEIL: Gardez cette sauvegarde avant toute modification!" -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "❌ ERREUR lors de la sauvegarde:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")