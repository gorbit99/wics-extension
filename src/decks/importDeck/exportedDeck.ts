import JSZip from "jszip";
import { CustomDeck, CustomDeckExportData } from "../../storage/customDeck";
import { FieldGroupRenderer } from "../itemForm/fields";
import { FileFieldRender } from "../itemForm/fileField";

interface ExportedDeckParameters {
  file: File;
}

export function exportedDeckFields() {
  return new FieldGroupRenderer<ExportedDeckParameters>({
    file: new FileFieldRender("Deck file", {
      accept: ".deck",
    }),
  });
}

export function importExportedDeck(
  parameters: ExportedDeckParameters
): Promise<CustomDeck> {
  return new Promise((resolve) => {
    JSZip.loadAsync(parameters.file).then(async (zip) => {
      const data = await zip.file("deck.json")!.async("string");
      const exportData = JSON.parse(data) as CustomDeckExportData;
      const deck = CustomDeck.fromExportData(exportData);
      resolve(deck);
    });
  });
}
