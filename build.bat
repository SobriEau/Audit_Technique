@echo off
echo ============================================
echo   SobriEau - Build Angular vers index.html
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
echo Node.js detecte : %NODE_VERSION%

REM Verifier que les dependances locales sont installees
if not exist "node_modules\.bin\ng.cmd" (
  echo.
  echo Les dependances ne sont pas installees.
  echo Lancez install.bat d'abord, puis relancez build.bat.
  pause
  exit /b 1
)

REM Utiliser Angular CLI local (node_modules\.bin\ng.cmd)
set NG=node_modules\.bin\ng.cmd

REM Build Angular avec le CLI local
echo.
echo Build Angular en cours...
call %NG% build
if %ERRORLEVEL% neq 0 (
  echo ERREUR lors du build Angular.
  pause
  exit /b 1
)

REM Inliner JS/CSS dans index.html pour creer un fichier autonome
echo.
echo Creation du fichier index.html autonome...
call node inline-build.js
if %ERRORLEVEL% neq 0 (
  echo ERREUR lors de l'inlining.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Build termine !
echo   Ouvrez index.html dans votre navigateur.
echo ============================================
echo.
pause
