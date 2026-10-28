/**
 * Mock data for design validation.
 *
 * Shapes deliberately mirror the planned tables so replacing this module with
 * real queries is a swap, not a rewrite. Delete once `lib/data/` is wired up.
 */

export type Discipline =
  | "programovani"
  | "hudba"
  | "zvuk"
  | "grafika2d"
  | "grafika3d"
  | "leveldesign"
  | "scenar"
  | "marketing";

export const disciplineLabels: Record<Discipline, string> = {
  programovani: "Programování",
  hudba: "Hudba",
  zvuk: "Zvuk",
  grafika2d: "2D grafika",
  grafika3d: "3D grafika",
  leveldesign: "Level design",
  scenar: "Scénář",
  marketing: "Marketing",
};

export interface Profile {
  handle: string;
  displayName: string;
  location: string;
  bio: string;
  /** Disciplines this person offers. */
  offers: Discipline[];
  /** Disciplines this person is missing. */
  needs: Discipline[];
  completedTrades: number;
  credits: number;
}

export interface RequestRow {
  id: string;
  title: string;
  /** What the requester needs done. */
  needs: Discipline;
  /** What they can give back. */
  gives: Discipline[];
  /** Rough size of the task, in hours, as estimated by the requester. */
  estimateHours: number;
  credits: number;
  author: Pick<Profile, "handle" | "displayName">;
  postedAgo: string;
  offerCount: number;
}

export const currentProfile: Profile = {
  handle: "gimli",
  displayName: "Gimli",
  location: "Liberec",
  bio: "Deset let v C# a Pythonu, teď stavím malou survival hru v Godotu. Kód zvládnu sám, u zvuku jsem ztracený.",
  offers: ["programovani", "leveldesign"],
  needs: ["hudba", "zvuk", "grafika2d"],
  completedTrades: 7,
  credits: 34,
};

export const requests: RequestRow[] = [
  {
    id: "r1",
    title: "Smyčka do menu, 30 sekund, temné fantasy",
    needs: "hudba",
    gives: ["programovani"],
    estimateHours: 3,
    credits: 6,
    author: { handle: "gimli", displayName: "Gimli" },
    postedAgo: "před 2 hodinami",
    offerCount: 2,
  },
  {
    id: "r2",
    title: "Shader na vodu do 2D top-down hry",
    needs: "programovani",
    gives: ["grafika2d", "grafika3d"],
    estimateHours: 5,
    credits: 10,
    author: { handle: "vesna", displayName: "Věra Šímová" },
    postedAgo: "včera",
    offerCount: 5,
  },
  {
    id: "r3",
    title: "Ikony předmětů do inventáře, 24 kusů, pixel art 32×32",
    needs: "grafika2d",
    gives: ["hudba", "zvuk"],
    estimateHours: 8,
    credits: 16,
    author: { handle: "tomask", displayName: "Tomáš Kraus" },
    postedAgo: "před 3 dny",
    offerCount: 1,
  },
  {
    id: "r4",
    title: "Korektura a úprava dialogů, asi 4000 slov",
    needs: "scenar",
    gives: ["programovani", "leveldesign"],
    estimateHours: 4,
    credits: 8,
    author: { handle: "petrah", displayName: "Petra Hájková" },
    postedAgo: "před 4 dny",
    offerCount: 0,
  },
  {
    id: "r5",
    title: "Zvuky kroků na čtyřech površích",
    needs: "zvuk",
    gives: ["grafika3d"],
    estimateHours: 2,
    credits: 4,
    author: { handle: "mirek", displayName: "Miroslav Doležal" },
    postedAgo: "před týdnem",
    offerCount: 3,
  },
];
