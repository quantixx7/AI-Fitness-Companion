# AI Fitness Companion - Backend

This is the FastAPI backend API for the AI Fitness Companion application.

## Project Structure

```text
backend/
├── app/
│   ├── __init__.py
│   └── main.py
├── requirements.txt
├── .env
├── .gitignore
└── README.md
```

## Setup and Run Instructions

### 1. Prerequisites
- Python 3.10 or higher installed.

### 2. Create a Virtual Environment
From the `backend` directory, run:
```bash
python -m venv .venv
```

Activate the virtual environment:
- **Windows (PowerShell):**
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- **macOS / Linux:**
  ```bash
  source .venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Running the Development Server
Run the FastAPI server using `uvicorn`:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Once running, you can access the API documentation at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
