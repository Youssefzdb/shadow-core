export const SHANNON_MEMORY_DESCRIPTION = `Persistent memory for long autonomous pentest sessions.
Stores findings, target info, credentials, and phase results.
The model writes to this memory to survive long loops (hours+).

Actions:
- "save" — Save a finding or result (requires key + value)
- "recall" — Retrieve all stored memories
- "summary" — Get a compact summary of all findings
- "clear" — Clear all memories

The memory is automatically injected into the system prompt at each turn,
so the model never forgets past findings during long sessions.

Example:
  { "action": "save", "key": "sql-injection-users", "value": "SQLi found in /api/users?id=1 -- UNION SELECT password FROM users" }
  { "action": "recall" }  → Returns all stored findings
  { "action": "summary" }  → Compact summary for quick review`

export const MEMORY_FILE = "/tmp/shadow-core-memory.json"
