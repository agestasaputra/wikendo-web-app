# Page Revamp Workflow — 🔒 LOCKED 9 Oct 2026

> Prevents miscommunication. Clear feedback loop. Anything outside the template = not locked yet.

## 5 Steps (with feedback loop)

1. Agesta uploads refs → AI analyzes preferences (3 lines) → Agesta OKs.
2. AI makes 20 HTML options, each with a big ID.
3. Agesta replies (only 2 valid templates; the reply text itself stays in Indonesian):
   - Without feedback: `Gua suka [ID]` ("I like [ID]") (= final lock)
   - With feedback:
     ```
     Gua suka [ID], tapi ada beberapa feedback:
     - feedback 1
     - feedback 2
     ```
4. AI updates the design per the feedback + sends the HTML file again (same ID, revised version — don't change the ID).
5. Loop until final:
   - Agesta says `iya` ("yes", no feedback) → AI executes straight through to deploy (TDD passed, repo 0 errors, adapt features, check that prod matches the final [ID]).
   - Agesta says `iya` + new feedback → back to step 4, iterate again until a clean `iya`.

## Key Rules

- No ID = not executed yet. The AI must ask for the ID before coding.
- An HTML revision does not change the ID — revisions attach to the same ID to avoid miscommunication.
- The HTML board is not a coding spec. Slicing stays 1:1 per SOP §8.
- Source: skill `agesta-app-workflow` §9 (single source of truth for the SOP).
