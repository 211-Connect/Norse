# Search UX prototype
Throwaway branch. Do not merge. No database, no real data.
    node prototype/stub-backend.mjs
    . prototype/env.sh && npx next dev -p 3100
Open http://localhost:3100. Click the search box for the guided flow: need, location, then up to 3 questions. "Skip to results" works at every step, and "Not now" moves past an optional location step. Below `xl` a floating Quick exit stays at the bottom left. On the results page, the orange help button appears after the 3rd result.
The vocabulary is real SUNE v1 (ArchitectureDocs PR #75). The classifier is keyword rules and the services are synthetic:
`src/app/(app)/features/search/sune-demo/sune.mjs`.
Demo searches: `food`, `shelter`, `help`, `my child needs food and I don't have a car`, `I want to kill myself`.
The orange button opens two steps: step 1 corrects the SUNE tags, step 2 ranks the kinds of help by drag. The kinds stand in for HSIS, in `KINDS` in `sune.mjs`; the order rides in the `taxonomy` URL key as `H-` and `HX-` tokens.
Danger: `dangerBand` in `sune.mjs` reads the words of the search. High danger shows 988 and 911 in the red box on every load, and the box asks the emergency question first. Middle danger (`he hits me`) shows the question, and the numbers follow an emergency answer. That answer stays in memory, never in the URL.

## Phone layout (round 16)

Below `md`, a List and Map toggle sits at the bottom right, and only one view shows. The map loads only when chosen. The sticky search bar and the refine row pin to the top. The refine row compacts on scroll, a tap opens it, and more scrolling compacts it again. The 988 and 911 numbers pin as a thin row and never compact.
