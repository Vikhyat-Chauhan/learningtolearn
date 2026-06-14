// Field-guide overview content, transcribed from mastery-half-page.pdf. This is
// the PDF's condensed wording (shorter than the card answers in cards.ts), so it
// lives separately rather than being derived from the deck.

export const overviewPrinciple =
  "The one principle: desirable difficulties. Effort while learning — recalling, spacing, mixing — builds durable skill; ease builds only an illusion of competence. If it feels effortful, it's working.";

export type OverviewItem = {
  num: string;
  title: string;
  desc: string;
  tag: string;
};

export const overviewItems: OverviewItem[] = [
  {
    num: "01",
    title: "Understand first",
    desc: "Build the structure and the “why” before details. New facts need a scaffold to stick to.",
    tag: "schemas, not memory",
  },
  {
    num: "02",
    title: "Teach it",
    desc: "Explain it plainly, as if to a beginner. Wherever you stumble is the exact gap.",
    tag: "Feynman technique",
  },
  {
    num: "03",
    title: "Retrieve",
    desc: "Recall from memory before reviewing; solve before peeking. The struggle is the learning.",
    tag: "testing effect",
  },
  {
    num: "04",
    title: "Space it",
    desc: "Review across days, just as you start to forget — never all in one block.",
    tag: "beats cramming",
  },
  {
    num: "05",
    title: "Interleave",
    desc: "Mix problem types instead of blocking. Trains you to spot which approach applies.",
    tag: "transfer",
  },
  {
    num: "06",
    title: "Practice deliberately",
    desc: "Drill your weakest sub-skill at the edge of ability, with tight feedback.",
    tag: "Ericsson",
  },
  {
    num: "07",
    title: "Sleep on it",
    desc: "Consolidation happens overnight; spacing lets it work. All-nighters block both.",
    tag: "memory consolidation",
  },
  {
    num: "08",
    title: "Calibrate",
    desc: "Predict whether you'll get it right before checking. Confidence misleads.",
    tag: "metacognition",
  },
];

export const overviewDo =
  "understand · teach · retrieve · space · interleave · practice deliberately · sleep · calibrate";
export const overviewAvoid = "re-reading · highlighting · cramming";
export const overviewCite = "Roediger · Bjork · Ericsson · Dunlosky et al. 2013";
