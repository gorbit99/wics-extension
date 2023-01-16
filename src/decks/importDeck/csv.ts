import { CustomDeck } from "../../storage/customDeck";
import { ConstantFieldRenderer } from "../itemForm/constantField";
import { CsvFieldSelectorFieldRenderer } from "../itemForm/csvFieldSelectorField";
import { FieldGroupRenderer } from "../itemForm/fields";
import { FileFieldRenderer } from "../itemForm/fileField";
import { SelectFieldRenderer } from "../itemForm/selectField";
import { TextFieldRenderer } from "../itemForm/textField";
import Papa from "papaparse";
import { fetchUser } from "../../storage/wkapi/user";
import {
  AuxiliaryMeaning,
  AuxiliaryReading,
  WKItem,
  WKKanjiItem,
  WKRadicalItem,
  WKVocabularyItem,
} from "../../wanikani";
import { StorageHandler } from "../../storageHandler";
import { fetchSubjects } from "../../storage/wkapi";
import { fromSubject } from "../../wanikani/fromSubject";

interface CsvParameters {
  deckName: string;
  file: File;
  separator: string;
  listSeparator: string;
  hasHeader: boolean;
  itemTypes: "radical" | "kanji" | "vocabulary" | "field";

  fieldValues: Record<keyof typeof wkItemFields, string>;
}

const wkItemFields = {
  type: "Type",
  english: "English",
  characters: "Characters",
  additionalMeanings: "Additional Meanings",
  blockedMeanings: "Blocked Meanings",
  additionalReadings: "Additional Readings",
  blockedReadings: "Blocked Readings",
  meaningMnemonic: "Meaning Mnemonic",
  characterImageUrl: "Character Image URL",
  kanji: "Kanji",
  onyomi: "Onyomi",
  kunyomi: "Kunyomi",
  nanori: "Nanori",
  emphasis: "Emphasis",
  meaningHint: "Meaning Hint",
  readingHint: "Reading Hint",
  readingMnemonic: "Reading Mnemonic",
  radicals: "Radicals",
  vocabulary: "Vocabulary",
  audio: "Audio",
  kana: "Kana",
  partsOfSpeech: "Parts of Speech",
};

export async function csvFields() {
  return new FieldGroupRenderer<CsvParameters>({
    deckName: new TextFieldRenderer("Deck Name", {
      minLength: 1,
    }),
    file: new FileFieldRenderer("CSV file", { accept: "text/csv" }),
    separator: new TextFieldRenderer("Separator"),
    listSeparator: new TextFieldRenderer("List separator"),
    hasHeader: new ConstantFieldRenderer(true),
    itemTypes: new SelectFieldRenderer("Item types", {
      radical: "Radicals",
      kanji: "Kanji",
      vocabulary: "Vocabulary",
      field: "Field",
    }),
    fieldValues: new CsvFieldSelectorFieldRenderer<keyof typeof wkItemFields>(
      "Field values",
      "file",
      "separator",
      wkItemFields,
      {
        requiredFields: ["characters", "english"],
      }
    ),
  });
}

export async function importCsv(
  parameters: CsvParameters
): Promise<CustomDeck> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const separator =
        {
          "\\t": "\t",
          "": ",",
        }[parameters.separator] ?? parameters.separator;

      const listSeparator =
        {
          "\\t": "\t",
          "": ",",
        }[parameters.listSeparator] ?? parameters.listSeparator;

      const csvData = Papa.parse(reader.result as string, {
        delimiter: separator,
        skipEmptyLines: true,
      }).data as string[][];

      const firstRow = csvData[0]!;
      const fieldNames = parameters.fieldValues;
      const fieldIndices = Object.fromEntries(
        Object.entries(fieldNames).map(([key, value]) => [
          key,
          firstRow.indexOf(value),
        ])
      ) as Record<keyof typeof wkItemFields, number>;

      const user = await fetchUser();
      const deck = new CustomDeck(parameters.deckName, user.username);

      if (parameters.hasHeader) {
        csvData.shift();
      }

      let nextId = await StorageHandler.getInstance().getNewId();

      const wkItems = (await fetchSubjects()).map((subject) =>
        fromSubject(subject)
      );

      const getIdFromCharacter = (
        character: string,
        type: "radical" | "kanji" | "vocabulary"
      ) =>
        wkItems
          .find(
            (item) => item.getCharacters() == character && item.type == type
          )
          ?.getID() ?? 0;

      await Promise.all(
        csvData.map(async (row) => {
          const type =
            parameters.itemTypes === "field"
              ? row[fieldIndices.type]!
              : parameters.itemTypes;
          const item = parseRow(
            type as "radical" | "kanji" | "vocabulary",
            row,
            fieldIndices,
            nextId,
            listSeparator,
            getIdFromCharacter
          );
          nextId++;

          deck.addItem(await item);
        })
      );
      resolve(deck);
    };
    reader.readAsText(parameters.file);
  });
}

async function parseRow(
  type: "radical" | "kanji" | "vocabulary",
  row: string[],
  fieldIndices: Record<keyof typeof wkItemFields, number>,
  id: number,
  listSeparator: string,
  getIdFromCharacter: (
    character: string,
    type: "radical" | "kanji" | "vocabulary"
  ) => number
): Promise<WKItem> {
  const english = row[fieldIndices.english]!.split(listSeparator) as [
    string,
    ...string[]
  ];

  const additionalMeanings =
    row[fieldIndices.additionalMeanings]?.split(listSeparator) ?? [];
  const blockedMeanings =
    row[fieldIndices.blockedMeanings]?.split(listSeparator) ?? [];
  const auxiliaryMeanings = additionalMeanings
    .map((meaning) => ({ meaning, type: "whitelist" }))
    .concat(
      blockedMeanings.map((meaning) => ({ meaning, type: "blacklist" }))
    ) as AuxiliaryMeaning[];

  switch (type) {
    case "radical": {
      return new WKRadicalItem(
        id,
        english,
        row[fieldIndices.characters]!,
        auxiliaryMeanings,
        {
          study_material: {
            meaning_note: "",
            meaning_synonyms: [],
            reading_note: "",
            id: 0,
          },
        },
        row[fieldIndices.meaningMnemonic] ?? "",
        row[fieldIndices.characterImageUrl] ?? null,
        (row[fieldIndices.kanji]?.split(listSeparator) ?? []).map((character) =>
          getIdFromCharacter(character, "kanji")
        )
      );
    }
    case "kanji": {
      const additionalReadings =
        row[fieldIndices.additionalReadings]?.split(listSeparator) ?? [];
      const blockedReadings =
        row[fieldIndices.blockedReadings]?.split(listSeparator) ?? [];
      const auxiliaryReadings = additionalReadings
        .map((reading) => ({ reading, type: "whitelist" }))
        .concat(
          blockedReadings.map((reading) => ({ reading, type: "blacklist" }))
        ) as AuxiliaryReading[];

      return new WKKanjiItem(
        id,
        english,
        row[fieldIndices.characters]!,
        row[fieldIndices.onyomi]?.split(listSeparator) ?? [],
        row[fieldIndices.kunyomi]?.split(listSeparator) ?? [],
        row[fieldIndices.nanori]?.split(listSeparator) ?? [],
        (row[fieldIndices.emphasis] as
          | "onyomi"
          | "kunyomi"
          | "nanori"
          | undefined) ?? "onyomi",
        row[fieldIndices.meaningMnemonic] ?? "",
        row[fieldIndices.meaningHint] ?? "",
        row[fieldIndices.readingMnemonic] ?? "",
        row[fieldIndices.readingHint] ?? "",
        (row[fieldIndices.radicals]?.split(listSeparator) ?? []).map(
          (character) => getIdFromCharacter(character, "radical")
        ),
        (row[fieldIndices.vocabulary]?.split(listSeparator) ?? []).map(
          (character) => getIdFromCharacter(character, "vocabulary")
        ),
        auxiliaryMeanings,
        auxiliaryReadings,
        {
          study_material: {
            meaning_note: "",
            meaning_synonyms: [],
            reading_note: "",
            id: 0,
          },
        }
      );
    }
    case "vocabulary": {
      const additionalReadings =
        row[fieldIndices.additionalReadings]?.split(listSeparator) ?? [];
      const blockedReadings =
        row[fieldIndices.blockedReadings]?.split(listSeparator) ?? [];
      const auxiliaryReadings = additionalReadings
        .map((reading) => ({ reading, type: "whitelist" }))
        .concat(
          blockedReadings.map((reading) => ({ reading, type: "blacklist" }))
        ) as AuxiliaryReading[];

      return new WKVocabularyItem(
        id,
        english,
        row[fieldIndices.characters]!,
        [],
        row[fieldIndices.kana]?.split(listSeparator) ?? [],
        row[fieldIndices.meaningMnemonic] ?? "",
        row[fieldIndices.readingMnemonic] ?? "",
        (row[fieldIndices.kanji]?.split(listSeparator) ?? []).map((character) =>
          getIdFromCharacter(character, "kanji")
        ),
        [],
        [],
        row[fieldIndices.partsOfSpeech]?.split(listSeparator) ?? [],
        auxiliaryMeanings,
        auxiliaryReadings,
        {
          study_material: {
            meaning_note: "",
            meaning_synonyms: [],
            reading_note: "",
            id: 0,
          },
        }
      );
    }
  }
}
