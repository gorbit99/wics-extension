import { CustomDeck } from "../../storage/customDeck";
import { StorageHandler } from "../../storageHandler";
import {
  AuxiliaryMeaning,
  WKKanjiItem,
  WKRadicalItem,
  WKRelationship,
} from "../../wanikani";
import { generateForm, ItemFormConfig } from "../itemForm/factory";
import { FieldGroupRenderer } from "../itemForm/fields";
import { checkForMissingRelated } from "./related";

export type Radical = {
  level: number;
  characters: string;
  english: string[];
  kanji: string[];
  meaningMnemonic: string;
  auxiliaryMeanings: AuxiliaryMeaning[];
  relationships: WKRelationship;
};

const helpText = {
  level: "The deck level you need to be to unlock this radical.",
  radical:
    "The radical itself. This should be a single character. Image " +
    "radicals aren't supported yet.",
  english:
    "The names of the radical. This will be what needs to be input to pass" +
    "the review.",
  kanji: "The kanji that use this radical.",
  meaningMnemonic: "The mnemonic for the meaning of the radical.",
  auxiliaryMeanings:
    "Auxiliary meanings are meanings that are either not shown but accepted " +
    "as a valid answer, or they are explicitly disallowed.",
  auxiliaryMeaningsMeaning:
    "The meaning you want to either accept or disallow.",
  auxiliaryMeaningsType: "Whether you want to accept or disallow the meaning.",
  relationshipsMeaningNote:
    "This is your personal modification to the meaning mnemonic of the " +
    "radical. It can be used as a helpful reminder, or to clarify the meaning.",
  relationshipsMeaningSynonyms: "Your personal synonyms for the radical.",
};

const radicalFormConfig: ItemFormConfig<Radical> = {
  level: {
    type: "number",
    name: "Level",
    constraints: {
      min: 1,
    },
    helpText: helpText.level,
  },
  characters: {
    type: "text",
    name: "Radical",
    constraints: {
      minLength: 1,
      maxLength: 1,
    },
    helpText: helpText.radical,
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
              helpText: helpText.relationshipsMeaningNote,
            },
            meaning_synonyms: {
              type: "list",
              name: "Meaning Synonyms",
              constraints: {
                innerFieldConstraints: {
                  minLength: 1,
                  type: "latin",
                },
              },
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

const radicalInputFields: FieldGroupRenderer<Radical, ValidationParams> =
  generateForm<Radical, ValidationParams>(
    radicalFormConfig,
    "form",
    validateRadicalResult
  );

const radicalViewFields: FieldGroupRenderer<Radical, ValidationParams> =
  generateForm(radicalFormConfig, "dataView", validateRadicalResult);

async function validateRadicalResult(
  radical: Radical,
  validationParams: ValidationParams
) {
  const missingKanjiError = await checkForMissingRelated(
    radical.kanji,
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

export async function convertToRadical(
  values: Record<string, any>,
  deckId: number,
  deck: CustomDeck
): Promise<WKRadicalItem> {
  const radical = values as Radical;

  const kanjiIds = deck
    .getItems()
    .filter(
      (item) =>
        item.type === "kanji" && values.kanji.includes(item.getCharacters())
    )
    .map((item) => item.getDeckId());

  kanjiIds.forEach((id) =>
    (deck.getItem(id) as WKKanjiItem).addRelatedRadical(deckId)
  );

  // TODO: image radicals
  return new WKRadicalItem(
    await StorageHandler.getInstance().getNewId(),
    deckId,
    radical.level,
    radical.english as [string, ...string[]],
    radical.characters,
    radical.auxiliaryMeanings,
    radical.relationships,
    radical.meaningMnemonic,
    "",
    kanjiIds
  );
}

export { radicalInputFields, radicalViewFields };
