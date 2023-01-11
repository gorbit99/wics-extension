import { StorageHandler } from "../../storageHandler";
import {
  AuxiliaryMeaning,
  WKRadicalItem,
  WKRelationship,
  WKStudyMaterial,
} from "../../wanikani";
import { ComplexFieldRenderer } from "../itemForm/complexField";
import { ConstantFieldRenderer } from "../itemForm/constantField";
import { EditableMultilineFieldRenderer } from "../itemForm/editableMultiline";
import { EditableValueFieldRenderer } from "../itemForm/editableValue";
import { FieldGroupRenderer } from "../itemForm/fields";
import { GroupedListFieldRenderer } from "../itemForm/groupedListField";
import { ListFieldRenderer } from "../itemForm/listField";
import { MultiLineFieldRenderer } from "../itemForm/multilineField";
import { SelectFieldRenderer } from "../itemForm/selectField";
import { TextFieldRenderer } from "../itemForm/textField";

type Radical = {
  characters: string;
  english: string[];
  kanji: string[];
  meaningMnemonic: string;
  auxiliaryMeanings: AuxiliaryMeaning[];
  relationships: WKRelationship;
};

const radicalInputFields: FieldGroupRenderer<Radical> = new FieldGroupRenderer({
  characters: new TextFieldRenderer("Radical", 1, 1),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1, type: "latin" },
    1,
    undefined,
    true
  ),
  kanji: new ListFieldRenderer("Kanji", { minLength: 1, maxLength: 1 }),
  meaningMnemonic: new MultiLineFieldRenderer("Meaning Mnemonic"),
  auxiliaryMeanings: new GroupedListFieldRenderer(
    "Auxiliary Meanings",
    new FieldGroupRenderer<AuxiliaryMeaning>({
      meaning: new TextFieldRenderer("Meaning", 1, undefined, "latin"),
      type: new SelectFieldRenderer("Type", {
        whitelist: "Allow",
        blacklist: "Deny",
      }),
    })
  ),
  relationships: new ConstantFieldRenderer<WKRelationship>({
    study_material: {
      id: 0,
      meaning_note: "",
      reading_note: "",
      meaning_synonyms: [],
    },
  }),
});

const radicalViewFields: FieldGroupRenderer<Radical> = new FieldGroupRenderer({
  characters: new EditableValueFieldRenderer("Radical", 1, 1),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1, type: "latin" },
    1,
    undefined,
    true
  ),
  kanji: new ListFieldRenderer("Kanji", { minLength: 1, maxLength: 1 }),
  meaningMnemonic: new EditableMultilineFieldRenderer("Meaning Mnemonic"),
  auxiliaryMeanings: new GroupedListFieldRenderer(
    "Auxiliary Meanings",
    new FieldGroupRenderer<AuxiliaryMeaning>({
      meaning: new EditableValueFieldRenderer("Meaning", 1, undefined, "latin"),
      type: new SelectFieldRenderer("Type", {
        whitelist: "Allow",
        blacklist: "Deny",
      }),
    })
  ),
  relationships: new ComplexFieldRenderer<WKRelationship>(
    new FieldGroupRenderer<Required<WKRelationship>>({
      study_material: new ComplexFieldRenderer(
        new FieldGroupRenderer<WKStudyMaterial>({
          id: new ConstantFieldRenderer<number>(0),
          meaning_note: new EditableValueFieldRenderer("Meaning Note", 0),
          reading_note: new EditableValueFieldRenderer("Reading Note", 0),
          meaning_synonyms: new ListFieldRenderer(
            "Meaning Synonyms",
            { minLength: 1, type: "latin" },
            0
          ),
        })
      ),
    })
  ),
});

export async function convertToRadical(
  values: Record<string, any>
): Promise<WKRadicalItem> {
  const radical = values as Radical;

  // TODO: image radicals
  return new WKRadicalItem(
    await StorageHandler.getInstance().getNewId(),
    radical.english as [string, ...string[]],
    radical.characters,
    radical.auxiliaryMeanings,
    radical.relationships,
    radical.meaningMnemonic,
    "",
    await StorageHandler.getInstance().kanjiToIds(radical.kanji)
  );
}

export { radicalInputFields, radicalViewFields };
