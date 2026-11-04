# Search UX prototype
Throwaway branch. Do not merge. No database, no real data.
    node prototype/stub-backend.mjs
    . prototype/env.sh && npx next dev -p 3100
Open http://localhost:3100. Every search shows results first, then a refine question.
The vocabulary is real SUNE v1 (ArchitectureDocs PR #75). The classifier is keyword rules and the services are synthetic:
`src/app/(app)/features/search/sune-demo/sune.mjs`.
Demo searches: `food`, `shelter`, `help`, `my child needs food and I don't have a car`, `I want to kill myself`.
