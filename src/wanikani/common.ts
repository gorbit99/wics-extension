export interface WKRelationship {
  study_material: WKStudyMaterial;
}

export interface WKStudyMaterial {
  id: number;
  meaning_note: string;
  reading_note: string;
  meaning_synonyms: string[];
}

export interface AuxiliaryMeaning {
  type: "blacklist" | "whitelist";
  meaning: string;
}

export interface AuxiliaryReading {
  type: "blacklist" | "whitelist";
  reading: string;
}
