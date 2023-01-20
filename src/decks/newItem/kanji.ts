import { CustomDeck } from "../../storage/customDeck";
import { StorageHandler } from "../../storageHandler";
import {
  AuxiliaryMeaning,
  AuxiliaryReading,
  WKKanjiItem,
  WKRadicalItem,
  WKRelationship,
  WKVocabularyItem,
} from "../../wanikani";
import { generateForm, ItemFormConfig } from "../itemForm/factory";
import { FieldGroupRenderer } from "../itemForm/fields";
import { checkForMissingRelated } from "./related";

export type Kanji = {
  level: number;
  characters: string;
  english: string[];
  emphasis: "onyomi" | "kunyomi" | "nanori";
  onyomi: string[];
  kunyomi: string[];
  nanori: string[];
  radicals: string[];
  vocabulary: string[];
  meaningMnemonic: string;
  meaningHint: string;
  readingMnemonic: string;
  readingHint: string;
  auxiliaryMeanings: AuxiliaryMeaning[];
  auxiliaryReadings: AuxiliaryReading[];
  relationships: WKRelationship;
};

const helpText = {
  level: "The deck level you need to be to unlock the kanji.",
  kanji: "The kanji itself. This should be a single character.",
  english:
    "The meanings of the kanji. This will be what needs to be input to pass " +
    "the review.",
  emphasis:
    "This determines which reading type will be the one being taught and " +
    "asked for",
  onyomi: "The onyomi readings of the kanji.",
  kunyomi: "The kunyomi readings of the kanji.",
  nanori: "The nanori readings of the kanji.",
  radicals: "The radicals making up this kanji.",
  vocabulary: "The vocabulary items containing this kanji.",
  meaningMnemonic: "The mnemonic for the meaning of the kanji.",
  meaningHint: "The text for the small hint section of the meaning mnemonic.",
  readingMnemonic: "The mnemonic for the reading of the kanji.",
  readingHint: "The text for the small hint section of the reading mnemonic.",
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
  relationshipsMeaningNote:
    "This is your personal modification to the meaning mnemonic of the " +
    "kanji. It can be used as a helpful reminder, or to clarify the meaning.",
  relationshipsReadingNote:
    "This is your personal modification to the reading mnemonic of the " +
    "kanji. It can be used as a helpful reminder, or to clarify the reading.",
  relationshipsMeaningSynonyms: "Your personal synonyms for the kanji.",
};

const kanjiFormConfig: ItemFormConfig<Kanji> = {
  level: {
    type: "number",
    name: "Level",
    helpText: helpText.level,
    constraints: {
      min: 1,
    },
  },
  characters: {
    type: "text",
    name: "Kanji",
    constraints: { minLength: 1, maxLength: 1, type: "kanji" },
    helpText: helpText.kanji,
  },
  english: {
    type: "list",
    name: "Meanings",
    constraints: {
      minOptions: 1,
      innerFieldConstraints: { minLength: 1, type: "latin" },
    },
  },
  emphasis: {
    type: "select",
    name: "Emphasis",
    options: {
      onyomi: "Onyomi",
      kunyomi: "Kunyomi",
      nanori: "Nanori",
    },
    helpText: helpText.emphasis,
  },
  onyomi: {
    type: "list",
    name: "Onyomi",
    constraints: {
      innerFieldConstraints: { minLength: 1, type: "kana" },
    },
    helpText: helpText.onyomi,
  },
  kunyomi: {
    type: "list",
    name: "Kunyomi",
    constraints: {
      innerFieldConstraints: { minLength: 1, type: "kana" },
    },
    helpText: helpText.kunyomi,
  },
  nanori: {
    type: "list",
    name: "Nanori",
    constraints: {
      innerFieldConstraints: { minLength: 1, type: "kana" },
    },
    helpText: helpText.nanori,
  },
  radicals: {
    type: "list",
    name: "Radicals",
    constraints: {
      innerFieldConstraints: { minLength: 1 },
    },
    helpText: helpText.radicals,
  },
  vocabulary: {
    type: "list",
    name: "Vocabulary",
    constraints: {
      innerFieldConstraints: { minLength: 1, type: "japanese" },
    },
    helpText: helpText.vocabulary,
  },
  meaningMnemonic: {
    type: "multiLine",
    name: "Meaning Mnemonic",
    helpText: helpText.meaningMnemonic,
  },
  meaningHint: {
    type: "multiLine",
    name: "Meaning Hint",
    helpText: helpText.meaningHint,
  },
  readingMnemonic: {
    type: "multiLine",
    name: "Reading Mnemonic",
    helpText: helpText.readingMnemonic,
  },
  readingHint: {
    type: "multiLine",
    name: "Reading Hint",
    helpText: helpText.readingHint,
  },
  auxiliaryMeanings: {
    type: "groupedList",
    name: "Auxiliary Meanings",
    fields: {
      meaning: {
        type: "text",
        name: "Meaning",
        constraints: { minLength: 1, type: "latin" },
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
        constraints: { minLength: 1, type: "kana" },
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

const kanjiInputFields: FieldGroupRenderer<Kanji, ValidationParams> =
  generateForm(kanjiFormConfig, "form", validateKanjiResult);
const kanjiViewFields: FieldGroupRenderer<Kanji, ValidationParams> =
  generateForm(kanjiFormConfig, "dataView", validateKanjiResult);

async function validateKanjiResult(
  kanji: Kanji,
  validationParams: ValidationParams
) {
  const readingFields = {
    onyomi: kanji.onyomi,
    kunyomi: kanji.kunyomi,
    nanori: kanji.nanori,
  };

  const errors: Partial<Record<keyof Kanji, string>> = {};

  const mainReadingField = readingFields[kanji.emphasis];
  if (mainReadingField.length === 0) {
    errors[kanji.emphasis] = `Must have at least one ${kanji.emphasis} reading`;
  }

  const missingRadicalError = await checkForMissingRelated(
    kanji.radicals,
    validationParams.deck,
    "radical"
  );
  if (missingRadicalError) {
    errors["radicals"] = missingRadicalError;
  }

  const missingVocabularyError = await checkForMissingRelated(
    kanji.vocabulary,
    validationParams.deck,
    "vocabulary"
  );
  if (missingVocabularyError) {
    errors["vocabulary"] = missingVocabularyError;
  }

  return errors;
}

export async function convertToKanji(
  values: Record<string, any>,
  deckId: number,
  deck: CustomDeck
): Promise<WKKanjiItem> {
  const kanji = values as Kanji;

  const radicalIds = deck
    .getItems()
    .filter(
      (item) =>
        item.type === "radical" && kanji.radicals.includes(item.getCharacters())
    )
    .map((item) => item.getDeckId());
  radicalIds.forEach((id) =>
    (deck.getItem(id) as WKRadicalItem).addRelatedKanji(deckId)
  );

  const vocabularyIds = deck
    .getItems()
    .filter(
      (item) =>
        item.type === "vocabulary" &&
        kanji.vocabulary.includes(item.getCharacters())
    )
    .map((item) => item.getDeckId());
  vocabularyIds.forEach((id) =>
    (deck.getItem(id) as WKVocabularyItem).addRelatedKanji(deckId)
  );

  return new WKKanjiItem(
    await StorageHandler.getInstance().getNewId(),
    deckId,
    kanji.level,
    kanji.english as [string, ...string[]],
    kanji.characters,
    kanji.onyomi,
    kanji.kunyomi,
    kanji.nanori,
    kanji.emphasis,
    kanji.meaningMnemonic,
    kanji.meaningHint,
    kanji.readingMnemonic,
    kanji.readingHint,
    radicalIds,
    vocabularyIds,
    kanji.auxiliaryMeanings,
    kanji.auxiliaryReadings,
    kanji.relationships
  );
}

export { kanjiInputFields, kanjiViewFields };
