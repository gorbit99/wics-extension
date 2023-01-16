import JSZip from "jszip";
import { CustomDeck, CustomDeckExportData } from "../../storage/customDeck";
import { FieldGroupRenderer } from "../itemForm/fields";
import { FileFieldRenderer } from "../itemForm/fileField";

interface ExportedDeckParameters {
  file: File;
}

export function exportedDeckFields() {
  return new FieldGroupRenderer<ExportedDeckParameters>({
    file: new FileFieldRenderer("Deck file", {
      accept: ".deck",
    }),
  });
}

export async function importExportedDeck(
  parameters: ExportedDeckParameters
): Promise<CustomDeck> {
  const fileReader = new FileReader();
  const file = await new Promise((resolve) => {
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.readAsBinaryString(parameters.file);
  });
  const zip = await JSZip.loadAsync(file as string);
  const data = await zip.file("deck.json")!.async("string");
  const exportData = JSON.parse(data) as CustomDeckExportData;
  const deck = CustomDeck.fromExportData(exportData);
  return deck;
}
