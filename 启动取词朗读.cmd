@echo off
cd /d "%~dp0"
if not exist "%~dp0release\win-unpacked\SelectSpeak.exe" (
 echo Please run npm run pack first.
 pause
 exit /b 1
)
start "" "%~dp0release\win-unpacked\SelectSpeak.exe"
