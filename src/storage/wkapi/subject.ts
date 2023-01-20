import { WKResponseItem } from "../wkapi";
import { MassCache } from "./massCache";

export class SubjectHandler extends MassCache<WKSubject> {
  protected getCachePrefix(): string {
    return "subjects";
  }
  protected getEndpoint(): string {
    return "subjects";
  }
  protected getMinCacheTime(): number {
    return 10 * 60 * 1000;
  }

  private static instance: SubjectHandler;

  public static getInstance(): SubjectHandler {
    if (!SubjectHandler.instance) {
      SubjectHandler.instance = new SubjectHandler();
    }
    return SubjectHandler.instance;
  }
}

export interface WKSubject extends WKResponseItem {
  object: "radical" | "kanji" | "vocabulary";
  auxiliary_meanings: {
    meaning: string;
    type: "blacklist" | "whitelist";
  }[];
  characters: string | null;
  created_at: string;
  document_url: string;
  hidden_at: string | null;
  lesson_position: number;
  level: number;
  meaning_mnemonic: string;
  meanings: {
    meaning: string;
    primary: boolean;
    accepted_answer: boolean;
  }[];
  slug: string;
  spaced_repetition_system_id: number;
}

export interface WKRadicalSubject extends WKSubject {
  object: "radical";
  amalgamation_subject_ids: number[];
  character_images: (PngImage | SvgImage)[];
}

interface PngImage {
  url: string;
  content_type: "image/png";
  metadata: {
    color: string;
    dimensions: string;
    style_name: string;
  };
}

interface SvgImage {
  url: string;
  content_type: "image/svg+xml";
  metadata: {
    inline_styles: boolean;
  };
}

export interface WKKanjiSubject extends WKSubject {
  object: "kanji";
  amalgamation_subject_ids: number[];
  component_subject_ids: number[];
  meaning_hint: string | null;
  reading_hint: string | null;
  reading_mnemonic: string;
  readings: {
    reading: string;
    primary: boolean;
    accepted_answer: boolean;
    type: "onyomi" | "kunyomi" | "nanori";
  }[];
  visually_similar_subject_ids: number[];
}

export interface WKVocabularySubject extends WKSubject {
  object: "vocabulary";
  component_subject_ids: number[];
  context_sentences: {
    en: string;
    ja: string;
  }[];
  pronunciation_audios: {
    url: string;
    content_type: "audio/mpeg" | "audio/ogg";
    metadata: {
      gender: "male" | "female";
      source_id: number;
      pronunciation: string;
      voice_actor_id: number;
      voice_actor_name: string;
      voice_description: string;
    };
  }[];
  readings: {
    reading: string;
    primary: boolean;
    accepted_answer: boolean;
  }[];
  parts_of_speech: string[];
  reading_mnemonic: string;
}
