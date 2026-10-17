@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title MU H5 2.8 OFFLINE
if not exist "game\server.cjs" (
 echo Giai nen MU_H5_Full_2_8.zip truoc.
 pause
 exit /b 1
)
where node.exe >nul 2>&1
if errorlevel 1 (
 echo Can cai Node.js 18 tro len: https://nodejs.org/
 start "" "https://nodejs.org/"
 pause
 exit /b 1
)
set "HOST=127.0.0.1"
set "PORT=18082"
set "MU_DATA=%~dp0OFFLINE_SAVE"
if not exist "%MU_DATA%" mkdir "%MU_DATA%"
echo Mo: http://localhost:18082/mu/
start "" /b cmd /c "timeout /t 3 /nobreak ^>nul ^& start http://localhost:18082/mu/"
node "game\server.cjs"
pause
