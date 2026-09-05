# Erzeugt lokale Testwerte. Produktions-Secrets ueber Secret Management bereitstellen.
$postgresPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "POSTGRES_PASSWORD=$postgresPassword"
Write-Host "JWT_SECRET=$jwtSecret"
Write-Host "Diese Werte nur in .env eintragen und niemals committen."
