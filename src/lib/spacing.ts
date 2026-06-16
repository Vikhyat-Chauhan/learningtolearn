// The spaced-repetition ladder: a topic logged on day D generates reviews due on
// D+1, D+3, D+7, D+14, and D+30. Single source of truth — used by the logTopic
// action to materialize reviews and by the UI to preview the schedule.
export const REVIEW_LADDER = [1, 3, 7, 14, 30] as const;
