export interface WKRelationship {
  study_material: {
    id: number;
    meaning_note: string;
    reading_note: string;
    meaning_synonyms: string[];
  } | null;
}

export interface AuxiliaryMeaning {
  type: "blacklist" | "whitelist";
  meaning: string;
}

export interface AuxiliaryReading {
  type: "blacklist" | "whitelist";
  reading: string;
}
