import { CustomDeck } from "../../storage/customDeck";
import { StorageHandler } from "../../storageHandler";
import {
  AuxiliaryMeaning,
  AuxiliaryReading,
  Collocation,
  WKKanjiItem,
  WKRelationship,
  WKVocabularyItem,
} from "../../wanikani";
import { generateForm, ItemFormConfig } from "../itemForm/factory";
import { FieldGroupRenderer } from "../itemForm/fields";
import { checkForMissingRelated } from "./related";

interface Audio {
  url: string;
  contentType: "audio/mpeg" | "audio/ogg";
  pronunciation: string;
}

export type Vocabulary = {
  characters: string;
  english: string[];
  kana: string[];
  kanji: string[];
  meaningMnemonic: string;
  readingMnemonic: string;
  partsOfSpeech: string[];
  sentences: { english: string; japanese: string }[];
  auxiliaryMeanings: AuxiliaryMeaning[];
  auxiliaryReadings: AuxiliaryReading[];
  relationships: WKRelationship;
  collocations: Collocation[];
  audio: Audio[];
};

const helpText = {
  vocab: "The vocabulary word itself.",
  english:
    "The meanings of the word. This will be what needs to be input to pass " +
    "the review.",
  kana: "The kana readings of the word.",
  kanji: "The kanji making up this word.",
  meaningMnemonic: "The mnemonic for the meaning of the word.",
  readingMnemonic: "The mnemonic for the reading of the word.",
  partsOfSpeech: "The type of word this is. For example, noun, verb, etc.",
  sentences: "Example sentences using the word.",
  sentencesEnglish: "The English translation of the example sentence.",
  sentencesJapanese: "The Japanese example sentence.",
  auxiliaryMeanings:
    "Auxiliary meanings are meanings that are either not shown but accepted " +
    "as a valid answer, or they are explicitly disallowed.",
  auxiliaryMeaningsMeaning:
    "The meaning you want to either accept or disallow.",
  auxiliaryMeaningsType: "Whether you want to accept or disallow the meaning.",
  auxiliaryReadings:
    "Auxiliary readings are readings that are either not shown but accepted " +
    "as a valid answer, or they are explicitly disallowed.",
  auxiliaryReadingsReading:
    "The reading you want to either accept or disallow.",
  auxiliaryReadingsType: "Whether you want to accept or disallow the reading.",
  collocations: "Collocations are usage patterns for the word.",
  collocationsEnglish: "The English translation of the example.",
  collocationsJapanese: "The Japanese example.",
  collocationsPatternOfUse:
    "The pattern the example follows. For example '私の〜'",
  audio: "Audio examples for the pronunciation of the word.",
  audioUrl: "The URL of the audio file.",
  audioContentType: "The type of the audio file.",
  audioPronunciation: "The kana word the audio is for.",
  relationshipsMeaningNote:
    "This is your personal modification to the meaning mnemonic of the " +
    "kanji. It can be used as a helpful reminder, or to clarify the meaning.",
  relationshipsReadingNote:
    "This is your personal modification to the reading mnemonic of the " +
    "kanji. It can be used as a helpful reminder, or to clarify the reading.",
  relationshipsMeaningSynonyms: "Your personal synonyms for the kanji.",
};

const vocabularyFormConfig: ItemFormConfig<Vocabulary> = {
  characters: {
    type: "text",
    name: "Vocabulary",
    constraints: {
      minLength: 1,
      type: "japanese",
    },
    helpText: helpText.vocab,
  },
  english: {
    type: "list",
    name: "Meanings",
    constraints: {
      minOptions: 1,
      innerFieldConstraints: {
        minLength: 1,
        type: "latin",
      },
    },
    helpText: helpText.english,
  },
  kana: {
    type: "list",
    name: "Kana Readings",
    constraints: {
      minOptions: 1,
      innerFieldConstraints: {
        minLength: 1,
        type: "kana",
      },
    },
    helpText: helpText.kana,
  },
  kanji: {
    type: "list",
    name: "Kanji",
    constraints: {
      innerFieldConstraints: {
        minLength: 1,
        type: "kanji",
      },
    },
    helpText: helpText.kanji,
  },
  meaningMnemonic: {
    type: "multiLine",
    name: "Meaning Mnemonic",
    helpText: helpText.meaningMnemonic,
  },
  readingMnemonic: {
    type: "multiLine",
    name: "Reading Mnemonic",
    helpText: helpText.readingMnemonic,
  },
  partsOfSpeech: {
    type: "list",
    name: "Parts of Speech",
    constraints: {
      innerFieldConstraints: {
        minLength: 1,
      },
    },
    helpText: helpText.partsOfSpeech,
  },
  sentences: {
    type: "groupedList",
    name: "Example Sentences",
    fields: {
      english: {
        type: "text",
        name: "English",
        constraints: {
          minLength: 1,
          type: "latin",
        },
        helpText: helpText.sentencesEnglish,
      },
      japanese: {
        type: "text",
        name: "Japanese",
        constraints: {
          minLength: 1,
          type: "japanese",
        },
      },
    },
    helpText: helpText.sentences,
  },
  auxiliaryMeanings: {
    type: "groupedList",
    name: "Auxiliary Meanings",
    fields: {
      meaning: {
        type: "text",
        name: "Meaning",
        constraints: {
          minLength: 1,
          type: "latin",
        },
        helpText: helpText.auxiliaryMeaningsMeaning,
      },
      type: {
        type: "select",
        name: "Type",
        options: {
          whitelist: "Allow",
          blacklist: "Deny",
        },
        helpText: helpText.auxiliaryMeaningsType,
      },
    },
    helpText: helpText.auxiliaryMeanings,
  },
  auxiliaryReadings: {
    type: "groupedList",
    name: "Auxiliary Readings",
    fields: {
      reading: {
        type: "text",
        name: "Reading",
        constraints: {
          minLength: 1,
          type: "kana",
        },
        helpText: helpText.auxiliaryReadingsReading,
      },
      type: {
        type: "select",
        name: "Type",
        options: {
          whitelist: "Allow",
          blacklist: "Deny",
        },
        helpText: helpText.auxiliaryReadingsType,
      },
    },
    helpText: helpText.auxiliaryReadings,
  },
  collocations: {
    type: "groupedList",
    name: "Collocations",
    fields: {
      english: {
        type: "text",
        name: "English",
        constraints: {
          minLength: 1,
          type: "latin",
        },
        helpText: helpText.collocationsEnglish,
      },
      japanese: {
        type: "text",
        name: "Japanese",
        constraints: {
          minLength: 1,
          type: "japanese",
        },
        helpText: helpText.collocationsJapanese,
      },
      pattern_of_use: {
        type: "text",
        name: "Pattern of Use",
        constraints: {
          minLength: 1,
          type: "japanese",
        },
        helpText: helpText.collocationsPatternOfUse,
      },
    },
    helpText: helpText.collocations,
  },
  audio: {
    type: "groupedList",
    name: "Audio",
    fields: {
      url: {
        type: "text",
        name: "URL",
        constraints: {
          minLength: 1,
        },
        helpText: helpText.audioUrl,
      },
      contentType: {
        type: "select",
        name: "Content Type",
        options: {
          "audio/mpeg": "MPEG",
          "audio/ogg": "OGG",
        },
        helpText: helpText.audioContentType,
      },
      pronunciation: {
        type: "text",
        name: "Pronunciation",
        constraints: {
          minLength: 1,
          type: "kana",
        },
        helpText: helpText.audioPronunciation,
      },
    },
    helpText: helpText.audio,
  },
  relationships: {
    type: "complex",
    name: "Relationships",
    fields: {
      study_material: {
        type: "choice",
        name: "Study Material",
        formField: {
          type: "constant",
          name: "Study Material",
          value: {
            id: 0,
            meaning_note: "",
            reading_note: "",
            meaning_synonyms: [],
          },
        },
        dataViewField: {
          type: "complex",
          name: "Study Material",
          fields: {
            id: {
              type: "constant",
              name: "ID",
              value: 0,
            },
            meaning_note: {
              type: "text",
              name: "Meaning Note",
              helpText: helpText.relationshipsMeaningNote,
            },
            reading_note: {
              type: "text",
              name: "Reading Note",
              helpText: helpText.relationshipsReadingNote,
            },
            meaning_synonyms: {
              type: "list",
              name: "Meaning Synonyms",
              helpText: helpText.relationshipsMeaningSynonyms,
            },
          },
        },
      },
    },
  },
};

interface ValidationParams {
  deck: CustomDeck;
}

const vocabularyInputFields: FieldGroupRenderer<Vocabulary, ValidationParams> =
  generateForm(vocabularyFormConfig, "form", validateVocabularyResult);

const vocabularyViewFields: FieldGroupRenderer<Vocabulary, ValidationParams> =
  generateForm(vocabularyFormConfig, "dataView", validateVocabularyResult);

async function validateVocabularyResult(
  vocabulary: Vocabulary,
  validationParams: ValidationParams
) {
  const missingKanjiError = await checkForMissingRelated(
    vocabulary.kanji,
    validationParams.deck,
    "kanji"
  );

  if (!missingKanjiError) {
    return {};
  }

  return {
    kanji: missingKanjiError,
  };
}

export async function convertToVocabulary(
  values: Record<string, unknown>,
  deckId: number,
  deck: CustomDeck
): Promise<WKVocabularyItem> {
  const vocab = values as Vocabulary;

  const kanjiIds = deck
    .getItems()
    .filter(
      (item) =>
        item.type === "kanji" && vocab.kanji.includes(item.getCharacters())
    )
    .map((item) => item.getDeckId());

  kanjiIds.forEach((id) =>
    (deck.getItemByDeckId(id) as WKKanjiItem).addRelatedVocabulary(deckId)
  );

  return new WKVocabularyItem(
    await StorageHandler.getInstance().getNewId(),
    deckId,
    vocab.english as [string, ...string[]],
    vocab.characters,
    vocab.audio.map((audio) => ({
      url: audio.url,
      content_type: audio.contentType,
      voice_actor_id: 1,
      pronunciation: audio.pronunciation,
    })),
    vocab.kana,
    vocab.meaningMnemonic,
    vocab.readingMnemonic,
    kanjiIds,
    vocab.sentences,
    vocab.collocations,
    vocab.partsOfSpeech,
    vocab.auxiliaryMeanings,
    vocab.auxiliaryReadings,
    vocab.relationships
  );
}

export { vocabularyInputFields, vocabularyViewFields };
