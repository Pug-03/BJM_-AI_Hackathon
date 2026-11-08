import { educationLevels } from "./schemas/talent";

/** Form state for a hiring need (strings for inputs); shared by server pages and the form. */
export interface NeedDraft {
  id?: string;
  title: string;
  skills: string[];
  workMode: string;
  location: string;
  employmentType: string;
  educationLevel: string;
  ageMin: string;
  ageMax: string;
  offeredSetup: string[];
  description: string;
}

export const emptyNeed = (province = ""): NeedDraft => ({
  title: "",
  skills: [],
  workMode: "REMOTE",
  location: province,
  employmentType: "FULL_TIME",
  educationLevel: "",
  ageMin: "",
  ageMax: "",
  offeredSetup: [],
  description: "",
});

export function needToInput(n: NeedDraft) {
  const num = (s: string) => (s.trim() ? Number(s) : null);
  return {
    id: n.id,
    title: n.title,
    skills: n.skills,
    workMode: n.workMode,
    location: n.location,
    employmentType: n.employmentType,
    educationLevel: (educationLevels as readonly string[]).includes(n.educationLevel)
      ? n.educationLevel
      : null,
    ageMin: num(n.ageMin),
    ageMax: num(n.ageMax),
    offeredSetup: n.offeredSetup,
    description: n.description,
  };
}
