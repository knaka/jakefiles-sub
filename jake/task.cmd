@echo off
setlocal enabledelayedexpansion

if "%APP_ENV%"=="" (
    set "NODE_SENV=default"
)

set "base_name=%~nx0"
if "%base_name:~0,5%"=="task-" (
    set "NODE_SENV=%base_name:5%"
)

set "script_dir=%~dp0"
set "script_path=%script_dir:~0,-1%\task.mjs"

node "%script_path%" %*
