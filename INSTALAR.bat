@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Instalando o Node.js, componente gratuito necessario para o app...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
    echo.
    echo Se a instalacao acima falhar, baixe manualmente em https://nodejs.org
    echo ^(botao da esquerda, LTS^), instale e rode este arquivo de novo.
    echo.
)

node instalar.mjs
pause
