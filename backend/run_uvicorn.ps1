# Run uvicorn with env vars loaded for local development
$env:DATABASE_URL = 'postgresql://postgres.yiswjxgpvhjhonqnuyzp:Praxis123!@aws-1-sa-east-1.pooler.supabase.com:5432/postgres'
$env:SUPABASE_URL = 'https://yiswjxgpvhjhonqnuyzp.supabase.co'
$env:SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpc3dqeGdwdmhqaG9ucW51eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjUzMTEsImV4cCI6MjA3NjIwMTMxMX0.sMQxgXmZeO8UAg1mhSUzkoyAGqC07xeyLI_5Sw2wW3c'
$env:SUPABASE_JWT_SECRET = 'U/3Ya/FpdAcoTmqUseRerngsbZ9PoXMRrJPIrMZisn1jIE2Y4wGd6SChWIs8oG+jGodvHFMc2iT9Y3tcfC0LGw=='
$env:PYTHONPATH = 'C:\Users\pedro\Downloads\Documentos\Praxis'
# Ensure current directory is backend (script's location) and start uvicorn via the venv python
Set-Location $PSScriptRoot
Write-Output "Starting uvicorn as background process (inheriting env vars)..."
$proc = Start-Process -FilePath 'C:\Users\pedro\Downloads\Documentos\Praxis\venv\Scripts\python.exe' -ArgumentList @('-m','uvicorn','app.main:app','--reload') -WorkingDirectory $PSScriptRoot -PassThru
Write-Output "Started process with Id: $($proc.Id)" 
