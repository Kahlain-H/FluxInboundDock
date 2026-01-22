@echo off
cd /d "W:\My Documents\FluxInboundDock"
set PATH=%CD%\node-v20.18.0-win-x64;%PATH%
echo ===========================================
echo    FLUXINBOUNDDOCK - SERVEUR DE DEV
echo ===========================================
echo.
echo Démarrage du serveur...
echo Le site sera accessible sur: http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo ===========================================
npm run dev