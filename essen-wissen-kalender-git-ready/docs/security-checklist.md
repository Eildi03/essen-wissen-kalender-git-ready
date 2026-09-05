# Sicherheits-Checkliste

- [ ] `.env` nicht in Git enthalten
- [ ] Produktionssecrets nicht im Image und nicht im Repository
- [ ] zufällige Werte für Datenbankpasswort und JWT-Secret
- [ ] PostgreSQL-Port in Produktion nicht veröffentlicht
- [ ] HTTPS-Zertifikat und Domain geprüft
- [ ] HSTS erst nach erfolgreicher HTTPS-Prüfung dauerhaft aktivieren
- [ ] Login-Rate-Limiting eingerichtet
- [ ] Brute-Force-Schutz und Kontosperre eingerichtet
- [ ] MFA für Administratoren eingerichtet
- [ ] serverseitiger Token-Widerruf oder Refresh-Token-Rotation eingerichtet
- [ ] getrennte PostgreSQL-Rollen für Migration und API
- [ ] Backups verschlüsselt und Restore getestet
- [ ] Uploads auf Größe, Typ und Schadsoftware geprüft
- [ ] öffentliche API gibt keine internen Kontaktdaten aus
- [ ] Healthchecks, Logs und Alarmierung aktiv
- [ ] Container- und Dependency-Scan durchgeführt
- [ ] Integrations- und Sicherheitstests erfolgreich
