## Personalization Architecture

### Data Model (in `auth-db.js` user object)

```javascript
{
  ...existingFields,
  learningProfile: {
    weakAreas: ["oxidation", "elektrolyse", "stoffmenge"],  // entity slugs from <60% quiz/exercise avg
    strongAreas: ["molare-masse", "saeuren-basen"],
    totalExercisesAttempted: 42,
    totalQuizzesCompleted: 15,
    lastUpdated: "2026-07-10T12:00:00Z"
  },
  memory: {
    conversations: [
      {
        sessionId: "ses_abc",
        date: "2026-07-09",
        topicSummary: "Redox reactions, balancing equations",
        messageCount: 8,
        weakAreasDetected: ["oxidation"]
      }
    ]
  },
  chatHistorySearch: "..."  // pre-computed search index (updated on each chat)
}
```

### LiteLLM System Prompt Injection

```
[CONVERSATION MEMORY]
Previous topics: Redox reactions (Jul 9), Stoichiometry (Jul 8), Periodic trends (Jul 5)

[LEARNING PROFILE]
Weak areas: Oxidation, Electrolysis, Amount of substance
Strong areas: Molar mass, Acid-base equilibrium

[INSTRUCTION]
Tailor your response to the user's level. Focus on their weak areas.
When explaining, connect to concepts they already know (their strong areas).
```

### Hint Generation Flow

```
POST /api/chat/hint { problem: "Balance: Fe + O2 → Fe2O3" }
  → LiteLLM prompt: "You are a chemistry tutor. User weakness: oxidation.
     Give a step-by-step hint for this problem. Do not give the answer."
  → Response: "1. Count Fe atoms on each side. 2. Count O atoms.
     3. What coefficient would make Fe equal? 4. Now check O..."
```
