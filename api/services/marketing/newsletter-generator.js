/**
 * Newsletter Generator Service - Generates weekly digests and monthly deep-dives
 */

export async function generateNewsletter(type = 'weekly', startDate, endDate) {
  const today = new Date().toISOString().split('T')[0];

  const newsletters = {
    weekly: generateWeeklyDigest(today),
    monthly: generateMonthlyDeepDive(today)
  };

  return newsletters[type];
}

function generateWeeklyDigest(today) {
  return {
    subject: `Chemie-Lernen Newsletter (Woche ${getWeekNumber(today)})`,
    preview: `Neue Videos, Entities und Quiz-Ergebnisse der Woche`,
    html: `<h2>Chemie-Lernen Newsletter (Woche ${getWeekNumber(today)})</h2>
<p>Moin liebe chemie-Lernen Community!</p>

<h3>🎬 Neue Videos von Zig's Chemistry 42</h3>
<ul>
  <li><a href="https://youtu.be/QfkBZ9EEXsM">Lesson 005-A: Fire, Chemical Reactions and the Mole</a></li>
  <li><a href="https://youtu.be/9Rw3imR6wP0">Lesson 004-A: From Coffee to Chemical Elements</a></li>
</ul>

<h3>📚 Neue Entities der Woche</h3>
<ul>
  <li><a href="/entity/atom/">Atom</a> – Grundbaustein der Materie</li>
  <li><a href="/entity/edelgas/">Edelgas</a> – Inertgase im Periodensystem</li>
  <li><a href="/entity/element/">Element</a> – Chemisches Element mit 118 verschiedenen</li>
</ul>

<h3>🧪 Quiz-Ergebnisse der Woche</h3>
<p>Diese Woche haben 127 Schüler das Redoxreaktionen-Quiz absolviert:
- Durchschnitt: 78% Prozentsatz
- Top-3 Fragen: "Elektronenübertragung", "Oxidationszahlen", "Anwendungen"</p>

<h3>🔮 Ausblick: Nächste Woche</h3>
<p>Veröffentlichung von 3 neuen Lernräumen für die Halogene (Chlor, Brom, Iod) in Mozilla Hubs. Stay tuned!</p>

<p>Bis nächste Woche! 🧪</p>`
  };
}

function generateMonthlyDeepDive(today) {
  return {
    subject: `Chemie-Lernen Monatlicher Deep-Dive (${today.substring(0, 7)})`,
    preview: `Zusammenfassung: Neue Inhalte, Community Highlights & Ausblick`,
    html: `<h2>Chemie-Lernen Monatlicher Deep-Dive (${today.substring(0, 7)})</h2>
<p>Hallo Community!</p>

<h3>🌟 Highlights des Monats</h3>
<ul>
  <li>5 neue Zig's Chemistry 42 Videos veröffentlicht</li>
  <li>12 neue Entities zum Knowledge Graph</li>
  <li>3D Lernräume für Alkali-Metalle launcht</li>
</ul>

<h3>📊 Community Zuwachs</h3>
<ul>
  <li>2,500 aktive Nutzer diese Woche</li>
  <li>42 neue Premium-Abonnellungen</li>
  <li>15,000 Quiz-Absolvierte im Gesamten</li>
</ul>

<h3>🚀 Was kommt als Nächstes?</h3>
<ul>
  <li>ZPD-based Assessment Engine (Q4 2026)</li>
  <li>Curricula-Integration für alle Bundesländer (Q1 2027)</li>
  <li>Mobile App für iOS & Android (Herbst 2027)</li>
</ul>`
  };
}

function getWeekNumber(dateString) {
  const date = new Date(dateString);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
