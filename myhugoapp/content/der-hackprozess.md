---
title: "Der Hackprozess: Ein Überblick für Einsteiger"
description: "Erfahren Sie, was ein Hackprozess ist, warum er wichtig ist und wie Sie erste Sicherheitslücken nachvollziehen können."
date: 2025-07-15
last_reviewed: 2026-07-09
tags: ["sicherheit", "hacking", "einsteiger", "cybersecurity", "pentest"]
interaktiv: false
schwierigkeit: "grundlagen"
teilgebiet: ["cybersicherheit"]
icon: "🔐"
---

Ethisches Hacken (auch *Pentesting* genannt) ist ein **strukturierter, methodischer Prozess** – keine wilde Code-Schlacht. Dieser Artikel führt Sie durch die fünf Standard-Phasen, die relevanten Werkzeuge und die rechtlichen Grundlagen.

## Warum ein Prozess?

Ohne Prozess übersieht man Schwachstellen oder produziert blinde Flecken. Ein standardisierter Ablauf stellt sicher:
- Alle Angriffsvektoren systematisch abgedeckt werden
- Ergebnisse reproduzierbar sind
- Keine illegalen Aktionen passieren
- Der Auftraggeber einen verwertbaren Bericht erhält

## Hauptkonzept

**Definition**: Ein Hackprozess ist die systematische, ethisch und rechtlich begründbare Abfolge von Schritten, um Sicherheitslücken in Software, Netzwerken oder Hardware aufzuspüren und zu bewerten.

Die **wichtigsten Eigenschaften** sind:
- **Methodisch und dokumentiert**: Jeder Schritt wird notiert, getestet und nachvollziehbar gemacht. Ohne Dokumentation entsteht kein verwertbares Ergebnis.
- **Genehmigt und legal**: Ethisches Hacken (Pentesting) erfolgt nur mit schriftlicher Erlaubnis des Eigentümers. Ungefragte Tests sind illegal.
- **Iterativ mit Feedback**: Ein Hackprozess besteht aus mehreren Zyklen. Ein Fund führt oft zu neuen Angriffsvektoren – der Prozess wiederholt sich, bis die Ziele erreicht sind.

## Die fünf Phasen eines Hackprozesses

### 1. Aufklärung (Reconnaissance)

Ziel ist es, Informationen zu sammeln, ohne das Zielsystem direkt zu berühren.

| Art | Beispiele | Werkzeuge |
|-----|-----------|-----------|
| **Passiv (OSINT)** | WHOIS, DNS-Abfragen, soziale Netzwerke, Jobausschreibungen | whois, dig, nslookup |
| **Aktiv** | Ping-Sweeps, Port-Scans, Banner-Grabbing | nmap, fping, netcat |

```bash
# Aktive Aufklärung: Offene Ports und Dienste erkennen
nmap -sV -p 1-10000 target.example.com
```

### 2. Schwachstellenanalyse (Vulnerability Assessment)

Mit den gewonnenen Daten werden bekannte Schwachstellen gesucht und bewertet:

| Methode | Beschreibung | Werkzeug |
|---------|-------------|----------|
| **CVE-Suche** | Abgleich von Software-Versionen mit öffentlichen Schwachstellendatenbanken | cve-search, NVD |
| **Automatischer Scan** | Netzwerkscanner prüfen auf bekannte Schwachstellen | OpenVAS, Nessus, Nikto |
| **Manuelle Analyse** | Blick für Fehlkonfigurationen (offene S3-Buckets, Standardpasswörter, Debug-Endpunkte) | Browser, curl, manuelle Prufung |

```bash
# Web-Schwachstellenscan
nikto -h http://target.example.com
```

> **Wichtig**: Nicht jede Schwachstelle ist ausnutzbar. Die Bewertung des Risikos (CVSS-Score) entscheidet uber die nächsten Schritte.

### 3. Ausnutzung (Exploitation)

Hier wird eine gefundene Lücke tatsächlich genutzt – jedoch **nur innerhalb des vorher vereinbarten Rahmens** (kein Löschen von Daten, kein Denial-of-Service außerhalb des Testszenarios). Typische Schritte:

1. Proof-of-Concept (PoC) entwickeln oder anpassen
2. Exploit im isolierten Testnetz validieren
3. Gezielte Ausnutzung im Zielsystem (mit Genehmigung!)

```bash
# Beispiel: Metasploit im abgesicherten Rahmen starten
msfconsole -q
use exploit/multi/http/struts2_content_type_ognl
set RHOSTS target.example.com
check
# Angriff erst nach Freigabe durchführen!
```

**Wichtige Grundsätze:**
- Keine Schäden anrichten (Daten löschen, Systeme zerstören)
- Minimalinvasiv vorgehen (nur die nötigste Interaktion)
- Beweise sichern (Screenshots, Logs)

### 4. Post-Exploitation und Persistenz (optional)

Nach erfolgreichem Zugriff wird dokumentiert:
- Welcher Angriff hat zu welchem Zugriff geführt?
- Welche Sensitivität haben die erlangten Daten?
- Welche Berechtigungen konnten erweitert werden (Privilege Escalation)?
- Welche Gegenmaßnahmen werden empfohlen?

### 5. Dokumentation und Reporting

Der wichtigste Teil fur den Auftraggeber – ein strukturierter Bericht enthalt:

1. **Executive Summary** (fur die Führungsebene, ohne Fachjargon)
2. **Technischer Teil** (genaue Beschreibung der Angriffswege)
3. **Risikobewertung** (CVSS-Scores, Priorisierung)
4. **Handlungsempfehlungen** (konkrete Maßnahmen zur Behebung)
5. **Nachweisanhang** (Logs, Screenshots, Befehle)

## Werkzeuge fur Einsteiger

| Werkzeug | Zweck | Einstiegslevel |
|----------|-------|----------------|
| nmap | Netzwerkscans, Portanalyse | Grundlagen |
| Burp Suite (Community) | Web-Proxy, Traffic-Manipulation | Mittel |
| gobuster | Verzeichnis- und DNS-Bruteforce | Fortgeschritten |
| sqlmap | Automatisierte SQL-Injection-Tests | Mittel |
| hydra | Passwort-Bruteforce (nur mit Erlaubnis!) | Fortgeschritten |

> **Warnung**: Die Nutzung dieser Werkzeuge gegen Systeme ohne Erlaubnis ist **strafbar**! Nutzen Sie eigene Testumgebungen wie DVWA, HackTheBox (Retired Machines) oder TryHackMe.

## Ethik und Recht

| Hut-Farbe | Verhalten | Legal? |
|-----------|-----------|--------|
| **Schwarzer Hut** | Handelt ohne Erlaubnis, krimineller Vorsatz | Illegal |
| **Weißer Hut** | Handelt legal, transparent, im offentlichen Interesse | Legal |
| **Grauer Hut** | Bewegt sich in der Grauzone (z.B. Schwachstelle ohne Zustimmung veroffentlichen) | Riskant |

**Grundregeln des ethischen Hackings:**

1. **Vorher schriftliche Erlaubnis einholen** (Scope of Work, Rules of Engagement)
2. **Nur das testen, was vereinbart wurde** (keine Seitwärtsbewegung ohne Erlaubnis)
3. **Keine Schäden verursachen oder Daten verändern**
4. **Schwachstellen vertraulich an den Betreiber melden** (Responsible Disclosure)

## Ubungsfragen zur Selbstkontrolle

1. **Nennen Sie zwei Werkzeuge fur die passive Aufklarung.**  
   Losung: WHOIS-Abfragen und dig/nslookup fur DNS-Recherche.

2. **Warum ist die schriftliche Genehmigung vor einem Pentest zwingend erforderlich?**  
   Losung: Ohne Genehmigung ist der Test illegal (Computerbetrug, Datenschutzverletzung). Die Genehmigung definiert außerdem den Umfang und schutzt beide Seiten.

3. **Was versteht man unter einem Proof-of-Concept (PoC)?**  
   Losung: Ein PoC ist ein funktionierender Nachweis, dass eine Schwachstelle tatsachlich ausnutzbar ist. Er zeigt, ob ein Angriff funktioniert, nicht wie weit man gehen kann.

## Zusammenfassung

Der Hackprozess besteht aus den Phasen **Aufklarung, Schwachstellenanalyse, Ausnutzung, Post-Exploitation und Dokumentation**. Er ist nur dann legal und ethisch vertretbar, wenn er mit Genehmigung, dokumentiert und ohne Zerstorung durchgefuhrt wird. Einsteiger sollten sichere Ubungsplattformen nutzen und sich langsam an fortgeschrittene Techniken herantasten.

## Verwandte Themen

- Grundlagen der Netzwerksicherheit
- Einfuhrung in nmap
- Responsible Disclosure - was tun nach einem Fund?
