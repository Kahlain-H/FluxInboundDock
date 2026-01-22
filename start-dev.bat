@echo off
cd /d "W:\My Documents\FluxInboundDock"
set PATH=%CD%\node-v20.18.0-win-x64;%PATH%
echo Installation des dépendances...
npm install
echo.
echo Lancement du serveur de développement...
npm run dev
pause