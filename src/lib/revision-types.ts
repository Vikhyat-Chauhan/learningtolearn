// Plain, serializable shapes passed from the server page into the client
// Revision components (Drizzle Date objects are mapped to ISO strings / booleans
// so nothing non-serializable crosses the RSC boundary).
import type { ISODate } from "@/lib/dates";

export type TopicVM = {
  id: string;
  title: string;
  notes: string | null;
  loggedOn: ISODate;
};

export type ReviewVM = {
  id: string;
  topicId: string;
  topicTitle: string;
  dueOn: ISODate;
  intervalIndex: number;
  completed: boolean;
};

export type UserVM = {
  id: string;
  email: string;
  name: string | null;
};
