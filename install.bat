@echo off
echo ============================================
echo   SobriEau - Installation des dependances
echo ============================================
echo.

REM Verifier que Node.js est installe
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo ERREUR : Node.js n'est pas installe.
  echo.
  echo Telechargez et installez Node.js ^(LTS^) depuis :
  echo   https://nodejs.org/
  echo.
  echo Puis relancez ce script.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo Node.js  : %NODE_VERSION%
echo npm      : %NPM_VERSION%
echo.

REM Installer toutes les dependances localement (package.json)
echo Installation des dependances npm (peut prendre quelques minutes)...
call npm install
if %ERRORLEVEL% neq 0 (
  echo ERREUR lors de npm install.
  pause
  exit /b 1
)
echo.

REM Verifier que Angular CLI est bien present dans node_modules
if not exist "node_modules\.bin\ng.cmd" (
  echo ERREUR : Angular CLI introuvable dans node_modules\.bin\
  echo Verifiez que @angular/cli est dans les devDependencies de package.json.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node_modules\.bin\ng.cmd version --skip-confirmation 2^>nul ^| findstr "Angular CLI"') do set NG_VERSION=%%i
echo Angular CLI installe : %NG_VERSION%
echo.

echo ============================================
echo   Installation terminee !
echo   Lancez build.bat pour construire l'appli.
echo ============================================
echo.
pause
