import subprocess
import sys
import os
import threading
from pathlib import Path

ROOT = Path(__file__).parent.resolve()

def log_output(stream, prefix):
    try:
        for line in iter(stream.readline, ''):
            if line:
                sys.stdout.write(f"[{prefix}] {line}")
                sys.stdout.flush()
    except Exception:
        pass

def main():
    print("========================================================")
    print("           Starting Agentic Social AI Autopilot         ")
    print("========================================================")
    
    # Locate virtualenv python
    backend_dir = ROOT / "backend"
    venv_python = backend_dir / ".venv" / "Scripts" / "python.exe"
    
    # Fallback to standard python if venv not found
    python_cmd = str(venv_python) if venv_python.exists() else "python"
    
    print(f"[Autopilot] Backend directory: {backend_dir}")
    print(f"[Autopilot] Python command: {python_cmd}")
    
    # Launch Backend
    print("[Autopilot] Dispatching FastAPI Backend server on port 8000...")
    backend_proc = subprocess.Popen(
        [python_cmd, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        cwd=str(backend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        errors='replace'
    )
    
    # Launch Frontend
    frontend_dir = ROOT / "frontend"
    print(f"[Autopilot] Frontend directory: {frontend_dir}")
    print("[Autopilot] Dispatching React Vite Frontend server on port 5173...")
    
    # npm command resolver for Windows (needs shell=True for npm command resolution)
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(frontend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        shell=True,
        errors='replace'
    )
    
    # Setup threads for logging stdout and stderr streams concurrently
    threads = [
        threading.Thread(target=log_output, args=(backend_proc.stdout, "FastAPI-Backend"), daemon=True),
        threading.Thread(target=log_output, args=(backend_proc.stderr, "FastAPI-Error"), daemon=True),
        threading.Thread(target=log_output, args=(frontend_proc.stdout, "React-Frontend"), daemon=True),
        threading.Thread(target=log_output, args=(frontend_proc.stderr, "React-Error"), daemon=True)
    ]
    
    for t in threads:
        t.start()
        
    print("\n[Autopilot] All systems launched!")
    print(" -> Backend available at: http://127.0.0.1:8000")
    print(" -> Frontend available at: http://127.0.0.1:5173")
    print("Press Ctrl+C to terminate both servers.")
    print("========================================================\n")
    
    try:
        # Keep python main script waiting while subprocesses run
        while True:
            # check if either process died
            if backend_proc.poll() is not None:
                print(f"\n[!] Backend process exited with code {backend_proc.poll()}")
                break
            if frontend_proc.poll() is not None:
                print(f"\n[!] Frontend process exited with code {frontend_proc.poll()}")
                break
            threading.Event().wait(1)
    except KeyboardInterrupt:
        print("\n[Autopilot] Interrupted! Terminating servers...")
    finally:
        # Graceful cleanup of processes
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            backend_proc.wait(timeout=2)
            frontend_proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            backend_proc.kill()
            frontend_proc.kill()
        print("[Autopilot] Clean shutdown completed successfully.")

if __name__ == "__main__":
    main()
