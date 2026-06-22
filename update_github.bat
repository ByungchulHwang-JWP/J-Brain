@echo off
setlocal

set "REPO_DIR=%~dp0"
set "COMMIT_MSG=%~1"

if "%COMMIT_MSG%"=="" (
  set "COMMIT_MSG=docs: update project deliverables"
)

echo [1/4] Repository status
git -C "%REPO_DIR%" status --short
if errorlevel 1 exit /b 1

echo [2/4] Staging changes
git -C "%REPO_DIR%" add -A
if errorlevel 1 exit /b 1

git -C "%REPO_DIR%" diff --cached --quiet
if not errorlevel 1 (
  echo No staged changes. Nothing to commit.
  exit /b 0
)

echo [3/4] Creating commit: %COMMIT_MSG%
git -C "%REPO_DIR%" commit -m "%COMMIT_MSG%"
if errorlevel 1 exit /b 1

echo [4/4] Pushing to origin
git -C "%REPO_DIR%" push
if errorlevel 1 exit /b 1

echo GitHub update completed.
endlocal
