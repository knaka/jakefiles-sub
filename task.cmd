@echo off
setlocal enabledelayedexpansion

if "%APP_ENV%"=="" (
    set "APP_ENV=unknown"
)

set "base_name=%~nx0"
if "%base_name:~0,5%"=="task-" (
    set "APP_ENV=%base_name:5%"
)

set "script_dir=%~dp0"
set "script_path=%script_dir:~0,-1%\task.mjs"

node "%script_path%" %*
