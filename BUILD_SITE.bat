@echo off
cd /d "W:\My Documents\FluxInboundDock"
set PATH=%CD%\node-v20.18.0-win-x64;%PATH%
echo Compilation du site pour production...
npm run build
echo.
echo Site compilé dans le dossier 'dist'
echo Vous pouvez maintenant servir les fichiers depuis 'dist' sur n'importe quel serveur web
pause