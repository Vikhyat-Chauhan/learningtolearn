export type Card = {
  /** Short step name shown in the meta row, e.g. "Retrieve". */
  label: string;
  /** Big number on the front. "00" and "★" render bare; others append "/08". */
  num: string;
  /** The question prompt on the front face. */
  cue: string;
  /** The answer on the back. Authored HTML (<strong>/<em>/<br>) — static, not user input. */
  answer: string;
  /** Attribution shown in the pill on the back. */
  cite: string;
};

// Copied verbatim from the original standalone HTML deck.
export const cards: Card[] = [
  {
    label: "The principle",
    num: "00",
    cue: "Why do the study methods that feel the most productive usually fail you?",
    answer:
      "<strong>Desirable difficulties.</strong> Effort during learning — recalling, spacing, mixing — builds skill that lasts, while ease — re-reading, highlighting, watching — builds only an illusion of competence. Rule of thumb: if it feels effortful, it's probably working.",
    cite: "Robert Bjork",
  },
  {
    label: "Understand first",
    num: "01",
    cue: "Before you try to memorize a single thing, what should you do?",
    answer:
      "<strong>Build the structure first.</strong> Get the big picture and the “why” before the details. Experts win on patterns and mental models, not raw memory — new facts need an existing structure to attach to.",
    cite: "Chase & Simon · chess studies",
  },
  {
    label: "Teach it",
    num: "02",
    cue: "How do you find out whether you actually understand something — or just recognize it?",
    answer:
      "<strong>Explain it in plain language</strong> as if teaching a beginner (the Feynman technique). Wherever you stumble or reach for jargon is the exact gap. Being able to follow an explanation is not the same as being able to produce one.",
    cite: "Self-explanation effect",
  },
  {
    label: "Retrieve",
    num: "03",
    cue: "What is the single highest-leverage move in all of studying?",
    answer:
      "<strong>Retrieve, don't review.</strong> Close the book and rebuild it from memory; attempt the problem before peeking at the answer. The struggle to recall <em>is</em> the learning — not a test of it.",
    cite: "Testing effect · Roediger & Karpicke",
  },
  {
    label: "Space it",
    num: "04",
    cue: "How do you beat the forgetting curve instead of fighting it twice?",
    answer:
      "<strong>Space your reviews across days.</strong> Revisit material just as you start to forget it, never all in one block. Cramming feels better in the moment and retains far less over time.",
    cite: "Spacing effect · Ebbinghaus",
  },
  {
    label: "Interleave",
    num: "05",
    cue: "How do you learn to pick the right approach — not just execute one you already know?",
    answer:
      "<strong>Interleave.</strong> Mix different problem types in a session instead of doing all of one kind in a row. It forces you to recognize <em>which</em> method applies — which is the genuinely hard part in any real situation.",
    cite: "Rohrer & Taylor",
  },
  {
    label: "Practice deliberately",
    num: "06",
    cue: "How do you actually improve a skill instead of just logging hours?",
    answer:
      "<strong>Deliberate practice.</strong> Target your weakest sub-skill at the edge of your ability, with tight feedback, in focused repetitions. Mere experience plateaus; feedback-driven, targeted effort does not.",
    cite: "Anders Ericsson",
  },
  {
    label: "Sleep on it",
    num: "07",
    cue: "What's the free multiplier that most learners waste entirely?",
    answer:
      "<strong>Sleep.</strong> Memory consolidation happens overnight, and spacing across days is partly what lets it work. An all-nighter blocks both the encoding that day and the consolidation that night.",
    cite: "Memory consolidation",
  },
  {
    label: "Calibrate",
    num: "08",
    cue: "How do you stop quietly fooling yourself about what you really know?",
    answer:
      "<strong>Calibrate.</strong> Before you check an answer, predict whether you'll get it right. The gap between predicted and actual performance is what redirects your effort. Confidence is a poor guide to mastery.",
    cite: "Metacognition",
  },
  {
    label: "Cheat sheet",
    num: "★",
    cue: "The entire deck, compressed into one line.",
    answer:
      "<strong>DO:</strong> understand → teach → retrieve → space → interleave → practice deliberately → sleep → calibrate.<br><br><strong>AVOID:</strong> re-reading, highlighting, cramming.",
    cite: "Dunlosky et al. 2013 · testing & spacing rated highest",
  },
];
