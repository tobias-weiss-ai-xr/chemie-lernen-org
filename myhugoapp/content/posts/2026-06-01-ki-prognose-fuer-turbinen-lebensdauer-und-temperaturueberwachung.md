---
title: "KI-Prognose für Turbinen: Lebensdauer und Temperaturüberwachung"
description: "KI-gestützte Prognose von Turbinen-Lebensdauer und Temperaturüberwachung in chemischen Kraftwerken für vorausschauende Wartung."
date: "2026-06-01T20:17:30+02:00"
tags:
  - "** machine-learning"
  - "ingenieurwesen"
  - "materialwissenschaft"
  - "verbrennung"
  - "prognose"
categories: ["forschung"]
draft: false
---

# KI-Prognose für Turbinen: Lebensdauer und Temperaturüberwachung

Diese Studie präsentiert ein Framework für Scientific Machine Learning zur Überwachung von Flugzeugtriebwerken (Engine Health Management). Ziel ist die zuverlässige Vorhersage der verbleibenden Nutzungsdauer (RUL) sowie thermischer Indikatoren wie der Turbinengastemperatur (TGT).

Für Chemiker ist der Kontext relevant: Die Lebensdauer von Turbinen wird maßgeblich durch materialwissenschaftliche Prozesse begrenzt. Hochtemperaturkorrosion und Oxidation von Superlegierungen unter extremer thermischer Belastung sind chemische Degradationspfade. Die Energiequelle ist die Verbrennung von Kraftstoff, vereinfacht dargestellt als Alkan wie $C_{12}H_{26}$, welche die Gastemperatur treibt.

Das vorgestellte Multi-Task-Modell nutzt einen gemeinsamen Encoder (CNN, BiLSTM, Attention) und liefert Unsicherheitsquantifizierungen via Vorhersageintervalle. Dies ermöglicht risikobewusste Wartungsentscheidungen statt einfacher Punktvorhersagen. Die Evaluation erfolgte mittels MAE, PICP und MPIW, stratifiziert nach Flugphasen. Das System ist durch practitioner-facing Parameter an betriebliche Richtlinien anpassbar.

**Tags:** machine-learning, ingenieurwesen, materialwissenschaft, verbrennung, prognose
