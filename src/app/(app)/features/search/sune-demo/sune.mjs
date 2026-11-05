// Prototype only. A SUNE-ish classifier and refine policy, shared by the fake backend and the page.
// The vocabulary is real (vocabulary.mjs). The keyword rules stand in for the needs classifier, and
// CATALOG stands in for the taxonomy scorecard plus the search index.
import {
  BARRIERS,
  CHARACTERISTICS,
  FAMILIES,
  NEEDS,
  URGENCY,
} from './vocabulary.mjs';

const byCode = new Map(
  [
    ...NEEDS.map((n) => [n.code, { ...n, kind: 'need', label: n.display }]),
    ...URGENCY.map((u) => [u.code, { ...u, kind: 'urgency', label: u.name }]),
    ...CHARACTERISTICS.map((c) => [c.code, { ...c, kind: 'characteristic' }]),
    ...BARRIERS.map((b) => [b.code, { ...b, kind: 'barrier' }]),
  ].map(([code, entry]) => [code, entry]),
);

export const lookup = (code) => byCode.get(code);
export const labelOf = (code) => byCode.get(code)?.label ?? code;
const familyOf = (code) => byCode.get(code)?.family;
const isNeed = (code) => code.startsWith('N-');
const isUrgency = (code) => /^U-/.test(code) && code !== 'U-X';

/** Everything a person can add from the Add pill: the real SUNE terms. */
export const ADDABLE = [...byCode.values()]
  .filter((entry) => entry.kind !== 'urgency')
  .map((entry) => ({
    code: entry.code,
    label: entry.label,
    hint: entry.kind === 'need' ? entry.spoken : (entry.question ?? ''),
  }));

/** Add's autocomplete. Words match by stem, so `disabled` finds "disability"; label hits come first. */
export function matchAddable(typed, excluded = []) {
  const stems = typed
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .map((word) => new RegExp(`\\b${word.slice(0, Math.max(4, word.length - 3))}`));
  if (stems.length === 0) return [];
  const hits = (text) => stems.every((stem) => stem.test(text.toLowerCase()));
  const open = ADDABLE.filter((term) => !excluded.includes(term.code));
  return [
    ...open.filter((term) => hits(term.label)),
    ...open.filter((term) => !hits(term.label) && hits(`${term.label} ${term.hint}`)),
  ].slice(0, 5);
}

// [pattern, weights]. A broad word spreads its weight over a family; a specific phrase commits to a leaf.
const NEED_RULES = [
  [/\b(food|hungry|groceries|nothing to eat|run(ning)? out of food)\b/i, { 'N-FOD-01': 0.55, 'N-FOD-04': 0.2, 'N-FOD-02': 0.2, 'N-FOD-03': 0.1 }],
  [/\b(food (bank|pantry)|pantry|food box)\b/i, { 'N-FOD-01': 0.92 }],
  [/\b(snap|food stamps|wic|ebt)\b/i, { 'N-FOD-02': 0.95 }],
  [/\b(formula|diabetic|renal|food allergy)\b/i, { 'N-FOD-03': 0.9 }],
  [/\b(meals?|cook|meals on wheels)\b/i, { 'N-FOD-04': 0.85 }],
  [/\b(drinking water|clean water|water is not safe)\b/i, { 'N-FOD-05': 0.9 }],
  [/\b(shelter|homeless)\b/i, { 'N-HOU-01': 0.7, 'N-HOU-04': 0.25, 'N-HOU-02': 0.1 }],
  [/\b(nowhere to (sleep|stay|go)|sleeping (in|on)|place to stay|on the street)\b/i, { 'N-HOU-01': 0.95 }],
  [/\b(housing|apartment|a place to live|rent)\b/i, { 'N-HOU-02': 0.4, 'N-HOU-04': 0.4, 'N-HOU-01': 0.3 }],
  [/\b(evict\w*|behind on rent|foreclos\w*)\b/i, { 'N-HOU-02': 0.92, 'N-LEG-02': 0.6 }],
  [/\b(mold|no heat|bugs|broken (pipes|furnace)|repairs?)\b/i, { 'N-HOU-03': 0.85 }],
  [/\b(electric\w*|utilit\w+|shut.?off|heating bill|gas bill|water bill)\b/i, { 'N-HOU-05': 0.9 }],
  [/\b(car|ride|rides|bus|transportation|get there|get to)\b/i, { 'N-TRN-01': 0.75 }],
  [/\b(car insurance|gas money|car repairs?)\b/i, { 'N-TRN-02': 0.9 }],
  [/\b(bills?|money|broke|cash)\b/i, { 'N-MON-01': 0.7 }],
  [/\b(lost my job|laid off|can'?t work)\b/i, { 'N-MON-02': 0.85, 'N-WRK-01': 0.6 }],
  [/\b(job|work|resume)\b/i, { 'N-WRK-01': 0.7 }],
  [/\b(doctor|clinic|nurse)\b/i, { 'N-HLT-01': 0.8 }],
  [/\b(medicine|insulin|prescription|medication)\b/i, { 'N-HLT-03': 0.9 }],
  [/\b(counsel\w*|therap\w*|depress\w*|anxiety|suicid\w*|kill myself|end my life)\b/i, { 'N-MHS-01': 0.9 }],
  [/\b(child ?care|daycare|babysit\w*)\b/i, { 'N-DLC-02': 0.9 }],
  [/\b(hits? me|hurting me|abus\w*|scared of (him|her|them))\b/i, { 'N-SAF-01': 0.9 }],
];

const URGENCY_RULES = [
  [/\b(suicid\w*|kill myself|end my life|has a (knife|gun)|hurting me right now|overdos\w*)\b/i, 'U-0'],
  [/\b(tonight|today|right now|this week|nowhere to (sleep|stay)|emergency|run(ning)? out)\b/i, 'U-1'],
  [/\b(hearing|court date|shut.?off|by (monday|tuesday|wednesday|thursday|friday)|eviction notice)\b/i, 'U-2'],
  [/\b(ongoing|every month|for months|for a year|chronic)\b/i, 'U-3'],
  [/\b(planning|prepare|before the baby|next year)\b/i, 'U-4'],
];

const TRAIT_RULES = [
  [/\b(veteran|served in the)\b/i, 'E-VET-01'],
  [/\b(senior|elderly|older adult|7\d|8\d|my (mom|dad|grand\w+))\b/i, 'E-AGE-06'],
  [/\b(my (child|son|daughter|kids?|baby)|parent|children)\b/i, 'E-HH-01'],
  [/\bsingle (mom|dad|parent)\b/i, 'E-HH-02'],
  [/\b(live alone|lives alone|by myself)\b/i, 'E-HH-03'],
  [/\bpregnant\b/i, 'E-PREG-01'],
  [/\b(sleeping (in|on)|on the street|in (my|a) car)\b/i, 'E-HOUS-03'],
  [/\b(don'?t have (a |the )?car|no car|can'?t get (to|there))\b/i, 'E-BAR-ACCESS'],
  [/\b(can'?t afford|too expensive|copay)\b/i, 'E-BAR-COST'],
  [/\b(don'?t know (who|where|what))\b/i, 'E-BAR-KNOW'],
];

const KEEP = 0.5;

/** Reads a sentence into weighted SUNE terms. Word count plays no part: "food" is high information. */
export function classifySune(text = '') {
  const weights = {};
  for (const [pattern, needWeights] of NEED_RULES) {
    if (!pattern.test(text)) continue;
    for (const [code, weight] of Object.entries(needWeights)) {
      weights[code] = Math.max(weights[code] ?? 0, weight);
    }
  }
  const ranked = Object.entries(weights)
    .map(([code, score]) => ({ code, score, label: labelOf(code) }))
    .sort((a, b) => b.score - a.score);
  const needs = ranked.filter((need) => need.score >= KEEP);
  const urgency = URGENCY_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? 'U-X';
  const traits = TRAIT_RULES.filter(([pattern]) => pattern.test(text)).map(
    ([, code]) => code,
  );
  // A broad word gives a family but no leaf: no term keeps a confident lead.
  const unsure = [...new Set(ranked.map((need) => familyOf(need.code)))].filter(
    (family) => {
      const inFamily = ranked.filter((n) => familyOf(n.code) === family);
      return inFamily.length > 1 && inFamily[0].score < 0.8;
    },
  );
  return {
    ranked,
    urgency,
    unsure,
    codes: [
      ...(needs.length ? needs : ranked.slice(0, 1)).map((need) => need.code),
      ...(urgency === 'U-X' ? [] : [urgency]),
      ...traits,
    ],
  };
}

const svc = (id, name, org, summary, who, needs, more = {}) => ({
  id: String(id), name, org, summary, who, needs,
  urgency: more.urgency ?? ['U-3'],
  comesToYou: Boolean(more.comesToYou),
  only: more.only ?? [],
});

/** Synthetic services. Each carries the SUNE terms the scorecard would give it. */
export const CATALOG = [
  svc(11, 'Food Pantry', 'Sampleton Food Bank', 'Groceries once a week, market style.', 'Open to all.', ['N-FOD-01'], { urgency: ['U-3'] }),
  svc(12, 'Emergency Food Boxes', 'Eastside Mission', 'A three-day food box, same day.', 'Open to all.', ['N-FOD-01'], { urgency: ['U-1'] }),
  svc(13, 'Saturday Mobile Pantry', 'Harvest Truck', 'Fresh food from a truck in your neighborhood.', 'Open to all.', ['N-FOD-01'], { urgency: ['U-3'], comesToYou: true }),
  svc(14, 'Same-Day Grocery Drop', 'Neighbors Deliver', 'Volunteers bring a bag of groceries to your door today.', 'People who cannot travel.', ['N-FOD-01', 'N-FOD-04'], { urgency: ['U-1'], comesToYou: true }),
  svc(15, 'School Backpack Program', 'Sampleton Schools', 'Weekend food for students to take home.', 'Families with children in school.', ['N-FOD-01'], { only: ['E-HH-01'] }),
  svc(16, 'SNAP Application Help', 'Sample County Benefits', 'Help applying for food benefits.', 'Low-income households.', ['N-FOD-02']),
  svc(17, 'WIC Clinic', 'Sample County Health', 'Food benefits for parents and young children.', 'Pregnant people and children under 5.', ['N-FOD-02'], { only: ['E-HH-01'] }),
  svc(18, 'Medical Diet Pantry', 'Sample Health Foundation', 'Renal, diabetic and allergy-safe food, and infant formula.', 'A doctor note helps.', ['N-FOD-03']),
  svc(19, 'Meals on Wheels', 'Sampleton Senior Services', 'Hot meals delivered at home.', 'Adults 60 and older who cannot cook.', ['N-FOD-04'], { comesToYou: true, only: ['E-AGE-06'] }),
  svc(20, 'Community Dining Room', 'Northside Church', 'A free hot lunch, Monday to Friday.', 'Open to all.', ['N-FOD-04', 'N-FOD-01'], { urgency: ['U-1', 'U-3'] }),
  svc(31, 'Emergency Night Shelter', 'Sampleton Rescue Mission', 'A bed tonight. Check in by 7 PM.', 'Adults, no ID needed.', ['N-HOU-01'], { urgency: ['U-1'] }),
  svc(32, 'Family Shelter', 'Hope House', 'Private rooms for families with children.', 'Families with minor children.', ['N-HOU-01'], { urgency: ['U-1'], only: ['E-HH-01'] }),
  svc(33, 'Veterans Bed Program', 'Sample VA Partners', 'Emergency beds and a case manager.', 'Veterans.', ['N-HOU-01'], { urgency: ['U-1'], only: ['E-VET-01'] }),
  svc(34, 'Street Outreach Team', 'Sample County Outreach', 'Staff come to you with supplies and a shelter referral.', 'People sleeping outside or in a car.', ['N-HOU-01'], { urgency: ['U-1'], comesToYou: true }),
  svc(35, 'Safe Parking Lot', 'Eastside Mission', 'A safe place to sleep in your car overnight.', 'People living in a vehicle.', ['N-HOU-01'], { urgency: ['U-1', 'U-3'] }),
  svc(36, 'Rent Assistance Fund', 'Sample Community Action', 'One-time help with back rent.', 'Households with a rent notice.', ['N-HOU-02'], { urgency: ['U-2'] }),
  svc(37, 'Eviction Defense Clinic', 'Sample Legal Aid', 'A free lawyer for your eviction hearing.', 'Tenants with a court date.', ['N-HOU-02', 'N-LEG-02'], { urgency: ['U-2'] }),
  svc(38, 'Housing Search Help', 'Sample Housing Authority', 'Help finding a place and paying the deposit.', 'Low-income households.', ['N-HOU-04'], { urgency: ['U-3', 'U-4'] }),
  svc(39, 'Rapid Rehousing', 'Hope House', 'Move-in costs and six months of support.', 'People leaving a shelter.', ['N-HOU-04'], { urgency: ['U-3'] }),
  svc(40, 'Home Repair Crew', 'Sample Rebuild', 'Free fixes for heat, pipes and mold.', 'Homeowners with low income.', ['N-HOU-03']),
  svc(41, 'Energy Assistance', 'Sample Community Action', 'Help paying a power or heat bill.', 'Low-income households.', ['N-HOU-05'], { urgency: ['U-1', 'U-2'] }),
  svc(51, 'Free Ride Line', 'Sample Transit', 'Door-to-door rides to food, doctors and work.', 'Book a day ahead.', ['N-TRN-01'], { comesToYou: true }),
  svc(52, 'Gas and Repair Vouchers', 'Sample Community Action', 'Vouchers for gas and small car repairs.', 'Low-income drivers.', ['N-TRN-02']),
  svc(53, 'Emergency Cash Help', 'Sample Salvation Corps', 'A small grant for a bill you cannot pay.', 'Once a year.', ['N-MON-01'], { urgency: ['U-1', 'U-2'] }),
  svc(54, 'Job Center', 'Sample WorkSource', 'Job search, resumes and training.', 'Open to all.', ['N-WRK-01', 'N-MON-02']),
  svc(55, 'Sliding-Scale Clinic', 'Sample Community Health', 'A doctor visit priced by income.', 'Open to all.', ['N-HLT-01', 'N-HLT-03']),
  svc(56, 'Counseling Center', 'Sample Behavioral Health', 'Same-week counseling.', 'Open to all.', ['N-MHS-01'], { urgency: ['U-1', 'U-3'] }),
  svc(57, 'Domestic Violence Advocates', 'Safe Harbor', 'A confidential advocate and a safe place to stay.', 'Anyone who is being hurt.', ['N-SAF-01', 'N-HOU-01'], { urgency: ['U-1'] }),
  svc(58, 'Child Care Subsidy Desk', 'Sample Family Services', 'Help paying for child care.', 'Working parents.', ['N-DLC-02']),
  svc(59, 'Help Line Navigator', 'Sample 211', 'A person listens and helps you find what you need.', 'Open to all.', ['N-ACC-02']),
];

const FIRST_LOOK = [12, 31, 59, 53, 55, 51].map(String);
const conflicts = (service, codes) =>
  service.only.some((needed) => {
    const prefix = needed.split('-').slice(0, 2).join('-');
    const stated = codes.filter((code) => code.startsWith(prefix));
    return stated.length > 0 && !stated.includes(needed);
  });

// Stand-in for HSIS: plain kinds of help, because no code reaches the screen. The real list comes from
// the scorecard. A service with no group below is its own kind, under its own name.
const KINDS = [
  ['pantries', 'Food pantries', 'Free groceries to take home.', [11, 12]],
  ['delivered', 'Food that comes to you', 'Groceries brought to your door or neighborhood.', [13, 14]],
  ['meals', 'Free hot meals', 'A cooked meal at a dining room or at home.', [19, 20]],
  ['benefits', 'Food benefits', 'Help with SNAP and WIC.', [16, 17]],
  ['beds', 'Emergency beds', 'A place to sleep tonight.', [31, 32, 33]],
  ['outreach', 'Outreach for people outside', 'Support for people sleeping outside or in a car.', [34, 35]],
  ['rent', 'Help keeping housing', 'Rent money and legal help to stop an eviction.', [36, 37]],
  ['rehousing', 'Help finding housing', 'Finding a place and paying to move in.', [38, 39]],
];
const kindOf = (service) => {
  const kind = KINDS.find(([, , , ids]) => ids.includes(Number(service.id)));
  return kind
    ? { key: kind[0], label: kind[1], description: kind[2] }
    : { key: service.id, label: service.name, description: service.summary };
};

// Phase 2 of the help panel writes these into the URL beside the SUNE codes, so the fake backend
// reruns the search with them: H- is the person's order, HX- is a kind they removed.
export const isRankToken = (code) => /^HX?-/.test(code);
export const orderToken = (key) => `H-${key}`;
export const removedToken = (key) => `HX-${key}`;

const applyRank = (services, tokens) => {
  const order = tokens.filter((t) => t.startsWith('H-')).map((t) => t.slice(2));
  const removed = tokens
    .filter((t) => t.startsWith('HX-'))
    .map((t) => t.slice(3));
  const rank = (service) => {
    const at = order.indexOf(kindOf(service).key);
    return at === -1 ? order.length : at;
  };
  return services
    .filter((service) => !removed.includes(kindOf(service).key))
    .map((service, at) => ({ service, at }))
    .sort((a, b) => rank(a.service) - rank(b.service) || a.at - b.at)
    .map(({ service }) => service);
};

/** The kinds of help behind a search, best first, plus the ones the person removed. */
export function rankKinds(codes) {
  const distinct = (services) => {
    const kinds = services.map(kindOf);
    return [...new Map(kinds.map((kind) => [kind.key, kind])).values()];
  };
  const kept = distinct(matchServices(codes));
  const all = distinct(baseServices(codes.filter((code) => !isRankToken(code))));
  return {
    kinds: kept,
    removed: all.filter((kind) => !kept.some((k) => k.key === kind.key)),
  };
}

/** Results for a search: what the terms match, then the person's own order on top. */
export function matchServices(codes) {
  return applyRank(
    baseServices(codes.filter((code) => !isRankToken(code))),
    codes.filter(isRankToken),
  );
}

/** Filter by exclusion: each answer removes what cannot fit, and a need keeps at least its best match. */
function baseServices(codes) {
  const needs = codes.filter(isNeed);
  if (needs.length === 0) {
    return CATALOG.filter((service) => FIRST_LOOK.includes(service.id));
  }
  const urgency = codes.find(isUrgency);
  const cannotTravel = codes.includes('E-BAR-ACCESS');
  const seen = new Set();
  return needs.flatMap((need) => {
    let found = CATALOG.filter(
      (service) => service.needs.includes(need) && !conflicts(service, codes),
    );
    for (const keep of [
      (service) => !urgency || urgency === 'U-0' || service.urgency.includes(urgency),
      (service) => !cannotTravel || service.comesToYou,
    ]) {
      const narrowed = found.filter(keep);
      if (narrowed.length > 0) found = narrowed;
    }
    return found.filter((service) => !seen.has(service.id) && seen.add(service.id));
  });
}

const leaf = (code, extra = {}) => ({ label: labelOf(code), add: [code], ...extra });
const FAMILY_QUESTION = {
  'N-FOD': {
    text: 'What kind of food help do you need?',
    level: 'important',
    leaves: ['N-FOD-01', 'N-FOD-04', 'N-FOD-02', 'N-FOD-03'],
  },
  'N-HOU': {
    text: 'What is going on with your housing?',
    level: 'critical',
    leaves: ['N-HOU-01', 'N-HOU-02', 'N-HOU-04', 'N-HOU-03', 'N-HOU-05'],
  },
};
const familyDisplay = (code) => FAMILIES.find((f) => f.code === code)?.display;
const ALSO = {
  'N-FOD': ['N-TRN-01', 'N-MON-01', 'N-HOU-05'],
  'N-HOU': ['N-MON-01', 'N-WRK-01', 'N-TRN-01'],
};
const STARTING_POINTS = ['N-FOD-01', 'N-HOU-01', 'N-MON-01', 'N-HLT-01', 'N-TRN-01'];
const TIME_CRITICAL = ['N-HOU-01', 'N-HLT-03', 'N-SAF-01', 'N-HOU-05'];

function candidates(query, codes) {
  const read = classifySune(query);
  const needs = codes.filter(isNeed);
  const out = [];
  const replaceFamily = (family) => needs.filter((code) => familyOf(code) === family);

  for (const family of read.unsure) {
    const question = FAMILY_QUESTION[family];
    if (!question || replaceFamily(family).length === 0) continue;
    if (family === 'N-HOU' && read.ranked[0]?.code === 'N-HOU-01') continue;
    out.push({
      id: `leaf-${family}`,
      text: question.text,
      level: question.level,
      why: `The classifier found ${familyDisplay(family)} but not which kind.`,
      answers: question.leaves.map((code) =>
        leaf(code, { remove: replaceFamily(family) }),
      ),
    });
  }

  const hasUrgency = codes.some(isUrgency);
  if (needs.includes('N-HOU-01') && !hasUrgency) {
    out.push({
      id: 'tonight',
      text: 'Where are you staying right now?',
      level: 'critical',
      why: 'This decides between a bed tonight and help finding a home.',
      answers: [
        { label: labelOf('E-HOUS-03'), add: ['U-1', 'E-HOUS-03'] },
        { label: labelOf('E-HOUS-04'), add: ['U-1', 'E-HOUS-04'] },
        { label: labelOf('E-HOUS-05'), add: ['U-3', 'E-HOUS-05', 'N-HOU-04'], remove: ['N-HOU-01'] },
        { label: labelOf('E-HOUS-02'), add: ['U-2', 'E-HOUS-02', 'N-HOU-02'], remove: ['N-HOU-01'] },
      ],
    });
  } else if (needs.length > 0 && !hasUrgency) {
    out.push({
      id: 'when',
      text: 'When do you need help?',
      level: needs.some((code) => TIME_CRITICAL.includes(code)) ? 'critical' : 'helpful',
      why: 'SUNE asks about urgency only when the answer changes the results.',
      answers: ['U-1', 'U-2', 'U-3', 'U-4'].map((code) => leaf(code)),
    });
  }

  if (needs.length > 0 && !codes.some((code) => code.startsWith('E-BAR'))) {
    out.push({
      id: 'barrier',
      text: 'What is getting in the way?',
      level: 'helpful',
      why: 'Help that comes to the person is a different set of services.',
      answers: ['E-BAR-ACCESS', 'E-BAR-COST', 'E-BAR-KNOW'].map((code) => leaf(code)),
    });
  }
  if (needs.some((code) => ['N-HOU-01', 'N-FOD-01'].includes(code))) {
    out.push({
      id: 'household',
      text: 'Who is this for?',
      level: 'helpful',
      why: 'Some services are only for certain people.',
      answers: ['E-HH-01', 'E-AGE-06', 'E-VET-01'].map((code) => leaf(code)),
    });
  }
  const also = ALSO[familyOf(needs[0])] ?? ['N-MON-01', 'N-WRK-01', 'N-HOU-05'];
  if (needs.length > 0) {
    out.push({
      id: 'also',
      text: 'Is anything else making this hard?',
      level: 'helpful',
      always: true,
      why: 'People often have more than one need.',
      answers: also.filter((code) => !codes.includes(code)).map((code) => leaf(code)),
    });
  }
  return out;
}

const applyAnswer = (codes, answer) => [
  ...new Set([
    ...codes.filter((code) => !(answer.remove ?? []).includes(code)),
    ...answer.add,
  ]),
];

const entropy = (counts) => {
  const total = counts.reduce((sum, count) => sum + count, 0) || 1;
  return -counts.reduce((sum, count) => {
    const share = count / total;
    return share > 0 ? sum + share * Math.log2(share) : sum;
  }, 0);
};

const LEVEL_RANK = { critical: 0, important: 1, helpful: 2 };

/**
 * The decision the page acts on. Results always show; this only picks what to ask beside them.
 * critical (red): the answer changes what kind of help is right.
 * important (orange): the search is vague, or a need has no leaf yet.
 * helpful (neutral): a question that narrows the list.
 */
export function decideRefine(query, codes, answered = []) {
  const urgency = codes.find(isUrgency);
  const needs = codes.filter(isNeed);
  const current = matchServices(codes);

  if (urgency === 'U-0') {
    return { kind: 'crisis', level: 'critical', total: current.length };
  }
  if (needs.length === 0 && !answered.includes('start')) {
    return {
      kind: 'question',
      level: 'important',
      total: current.length,
      question: {
        id: 'start',
        text: 'What do you need help with most?',
        why: 'The classifier found no need in this search.',
        answers: STARTING_POINTS.map((code) => ({
          ...leaf(code),
          keeps: matchServices([...codes, code]).length,
        })),
      },
    };
  }

  const scored = candidates(query, codes)
    .filter((question) => !answered.includes(question.id))
    .map((question) => {
      const answers = question.answers.map((answer) => ({
        ...answer,
        keeps: matchServices(applyAnswer(codes, answer)).length,
      }));
      const ids = [
        current.map((service) => service.id).join(),
        ...answers.map((answer) =>
          matchServices(applyAnswer(codes, answer))
            .map((service) => service.id)
            .join(),
        ),
      ];
      return {
        ...question,
        answers,
        changesResults: new Set(ids).size > 1,
        gain: entropy(answers.map((answer) => answer.keeps)),
      };
    })
    .filter((question) => question.always || question.changesResults)
    .filter((question) => question.answers.length > 0)
    .sort(
      (a, b) =>
        LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
        Number(Boolean(a.always)) - Number(Boolean(b.always)) ||
        b.gain - a.gain,
    );

  const [question] = scored;
  if (!question) return { kind: 'done', level: 'helpful', total: current.length };
  return { kind: 'question', level: question.level, total: current.length, question };
}

/** The questions for this need, fixed up front: an answer never changes how many are left. */
export function planQuestions(query, codes, max = 3) {
  const plan = [];
  while (plan.length < max) {
    const { question } = decideRefine(query, codes, plan.map((item) => item.id));
    if (!question) break;
    plan.push(question);
  }
  return plan;
}

export { applyAnswer };
