# Start the Backend Server in a new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

# Start the Frontend Dev Server in a new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Agentic Social AI is starting..." -ForegroundColor Green
Write-Host "Backend running at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend running at: http://localhost:5173" -ForegroundColor Cyan
