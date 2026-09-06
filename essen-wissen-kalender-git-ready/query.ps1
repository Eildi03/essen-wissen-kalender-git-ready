# Query-Script fuer Essen-Wissen Kalender (PowerShell)
# Fuehrt SQL-Queries aus

param(
    [Parameter(Mandatory=$true)]
    [string]$Query
)

Write-Host "[QUERY] Query wird ausfuehrt..." -ForegroundColor Cyan
Write-Host "        $Query" -ForegroundColor Gray
Write-Host ""

docker exec essen-wissen-kalender-postgres-1 psql `
    -U essen_wissen_admin `
    -d essen_wissen `
    -c "$Query" `
    --no-password

Write-Host ""
Write-Host "[DONE] Fertig!" -ForegroundColor Green
