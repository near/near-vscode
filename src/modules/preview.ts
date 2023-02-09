import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { window } from "vscode";

export class WidgetPreviewPanel {
  panel: vscode.WebviewPanel | undefined;
  readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public createPanel() {
    this.panel = vscode.window.createWebviewPanel(
      "WidgetPreview",
      "Widget Preview",
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      getWebviewOptions(this.context.extensionUri)
    );

    const isDark = vscode.ColorThemeKind.Dark === vscode.window.activeColorTheme.kind;
    this.panel.iconPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media",
      isDark ? "near-dark.png" : "near-light.png"
    );

    setHtmlForWebview(this.context, this.panel);
  }

  public showActiveCode(forceUpdate = false) {
    let code = window.activeTextEditor?.document?.getText() || "";

    this.panel?.webview.postMessage({
      command: "update-code",
      code: code,
      forceUpdate,
      widgetUri: "",
    });
  }
}

const setHtmlForWebview = (
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel
) => {
  const webview = panel.webview;
  const scriptPathOnDisk = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "main.js"
  );
  const styleResetPath = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "reset.css"
  );
  const stylesPathMainPath = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "vscode.css"
  );
  const html = getPanelHtmlFileContent(context)
    .replaceAll("{{cspSource}}", webview.cspSource)
    .replace(
      "{{stylesResetUri}}",
      webview.asWebviewUri(styleResetPath).toString()
    )
    .replace(
      "{{stylesMainUri}}",
      webview.asWebviewUri(stylesPathMainPath).toString()
    )
    .replace(
      "{{scriptUri}}",
      webview.asWebviewUri(scriptPathOnDisk).toString()
    );
  webview.html = html;
};

const getPanelHtmlFileContent = (context: vscode.ExtensionContext): string => {
  const filePath: vscode.Uri = vscode.Uri.file(
    path.join(context.extensionPath, "media", "panel.html")
  );
  return fs.readFileSync(filePath.fsPath, "utf8");
};

export function getWebviewOptions(
  extensionUri: vscode.Uri
): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
  };
}