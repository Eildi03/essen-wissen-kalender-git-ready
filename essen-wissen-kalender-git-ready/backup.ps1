# Backup-Script fuer Essen-Wissen Kalender (PowerShell)
# Erstellt ein vollstaendiges Datenbank-Backup

param(
    [string]$BackupDir = "./backups"
)

$ErrorActionPreference = "Stop"

# Verzeichnis erstellen falls nicht vorhanden
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "essen_wissen_$Timestamp.sql"

Write-Host "[BACKUP] Backup wird erstellt..." -ForegroundColor Cyan

# Backup ausfuehren
docker exec essen-wissen-kalender-postgres-1 pg_dump `
    -U essen_wissen_admin `
    -d essen_wissen `
    --no-password | Out-File -FilePath $BackupFile -Encoding UTF8

if (Test-Path $BackupFile) {
    $Size = [math]::Round((Get-Item $BackupFile).Length / 1MB, 2)
    Write-Host "[OK] Backup erfolgreich erstellt: $BackupFile ($Size MB)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backup fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# Alte Backups loeschen (aelter als 7 Tage)
Write-Host "[CLEANUP] Alte Backups werden geloescht..." -ForegroundColor Yellow
$CutoffDate = (Get-Date).AddDays(-7)
Get-ChildItem -Path $BackupDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force

Write-Host "[DONE] Fertig!" -ForegroundColor Green
