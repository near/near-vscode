import * as vscode from "vscode";
import { WidgetPreviewPanel } from "../modules/preview-panel";

export function preview(previewPanel: WidgetPreviewPanel, log: vscode.OutputChannel) {
  previewPanel.createAndShowPanel(log);
  previewPanel.showActiveCode();
}