@echo off
echo Starting Agentic Social AI...
backend\.venv\Scripts\python.exe start.py
if errorlevel 1 (
    python start.py
)
pause
