# VERNEN™ — Branding Strategy & API Integration Research
## Extracted from Claude.ai conversation history — February 2026

---

## BRANDING ARCHITECTURE (Decided)

**Platform/Engine Name:** VERNEN™
- Named after author's middle name (Michael Vernen Thomas Hartmann)
- Carries IP protection (trademark, copyright)
- Used on all technical files, manifests, documentation

**Public-Facing Brand (Under Consideration):**
- "Hartmann Compliance — Powered by VERNEN™"
- "Hartmann Rights — Powered by VERNEN™"
- Decision pending

**Names Rejected:**
| Name | Reason |
|------|--------|
| Hartmann Legal Assistant | "Legal Assistant" is regulated title in CA (BPC §6450) |
| Legal Aid | Associated with nonprofit; trademark conflict |
| Legal Resource | Passive; doesn't convey active analysis |

## ANTHROPIC API INTEGRATION

**Status:** Self-serve, available immediately
- Sign up: console.anthropic.com
- No approval, minimums, or contracts required
- Pay per use

**Cost Estimates (per VERNEN™ query):**
- Target: $0.05 per user query
- Claude Haiku (fast/cheap): ~$0.001–0.01 per query
- Claude Sonnet (balanced): ~$0.01–0.05 per query
- Claude Opus (maximum quality): ~$0.05–0.15 per query

**Revenue model development:** Pending (`Revenue_Models/`)

## COMPACTION MANAGEMENT

Claude.ai context window fills fast with tool calls and search results.
Best practices established through trial:
1. One task per chat session
2. Use files as persistent memory (not conversation context)
3. Minimize web search volume per message
4. Projects scope memory and search to prevent cross-contamination
5. Batch task prompts prevent mid-generation stops
