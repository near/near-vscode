import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { window } from "vscode";
import { getWidget } from "./NearWidget";

export class WidgetPreviewFactory {
  private static instance: WidgetPreviewFactory;

  private context: vscode.ExtensionContext;
  private previews: Record<string, WidgetPreview> = {};

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static init(context: vscode.ExtensionContext) {
    if (this.instance) {
      throw new Error("WidgetEditorPreview is already initialized");
    }
    this.instance = new WidgetPreviewFactory(context);
    vscode.window.registerWebviewPanelSerializer(WidgetPreview.viewType, {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: any
      ) {
        console.log(`Got state: ${state}`);
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
        // WidgetPreview.revive(webviewPanel, context);
      },
    });
  }

  static createOrFocus(widgetUri: vscode.Uri) {
    const existing =
      WidgetPreviewFactory.instance.previews[widgetUri.toString()];
    if (existing) {
      existing.panel.reveal(undefined, true);
      return existing;
    }
    const newPreview = WidgetPreview.create(
      WidgetPreviewFactory.instance.context,
      widgetUri,
      () => WidgetPreviewFactory.disposePreview(widgetUri)
    );
    WidgetPreviewFactory.instance.previews[widgetUri.toString()] = newPreview;
  }

  private static disposePreview(widgetUri: vscode.Uri) {
    delete WidgetPreviewFactory.instance.previews[widgetUri.toString()];
  }
}

export class WidgetPreview {
  public static readonly viewType = "WidgetPreview";

  readonly panel: vscode.WebviewPanel;
  readonly context: vscode.ExtensionContext;
  readonly widgetUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static create(
    extensionContext: vscode.ExtensionContext,
    widgetUri: vscode.Uri,
    onDispose: () => void
  ) {
    const viewColumn = vscode.ViewColumn.Beside;

    const panel = vscode.window.createWebviewPanel(
      WidgetPreview.viewType,
      "",
      {
        viewColumn,
        preserveFocus: true,
      },
      getWebviewOptions(extensionContext.extensionUri)
    );
    const isDark = [
      vscode.ColorThemeKind.Dark,
      vscode.ColorThemeKind.Dark,
    ].includes(vscode.window.activeColorTheme.kind);
    panel.iconPath = vscode.Uri.joinPath(
      extensionContext.extensionUri,
      "media",
      isDark ? "near-dark.svg" : "near-light.svg"
    );
    const newPreview = new WidgetPreview(
      widgetUri,
      panel,
      extensionContext,
      onDispose
    );
    return newPreview;
  }

  private constructor(
    widgetUri: vscode.Uri,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    onDispose: () => void
  ) {
    this.widgetUri = widgetUri;
    this.panel = panel;
    this.context = context;

    // Set the webview's initial html content
    this.panel.title = `Preview ${this.widgetUri.toString()}`;
    setHtmlForWebview(context, panel);
    
    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this.panel.onDidDispose(
      () => {
        this.dispose();
        onDispose();
      },
      null,
      this._disposables
    );

    // Update the content based on view changes
    this.panel.onDidChangeViewState(
      (e) => {
        console.log("onDidChangeViewState", {visible: e.webviewPanel.visible, active: e.webviewPanel.active, viewColumn: e.webviewPanel.viewColumn});
        this.updateCode();
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "request-update-code":
            this.updateCode();
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public updateCode() {
    const code = getWidgetSourceCode(this.widgetUri.toString());
    if (code) {
      this.panel.webview.postMessage({ command: "update-code", code });
    }
  }

  public dispose() {
    this.panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
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
    .replaceAll("{{nonce}}", getNonce())
    // .replace("{{widgetCode}}", getWidgetSourceCode(widgetUri.toString()))
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

export function getWidgetSourceCode(widgetUriStr: string): string {
  const widget = getWidget(widgetUriStr);
  if (!widget || widget.code === null) {
    window.showErrorMessage(`Error loading preview: ${widgetUriStr}`);
    return `return <code>error</code>`;
  } else {
    return widget.code;
  }
  // return (
  //   previewUrlPrefix +
  //   encodeURIComponent(`return <h1>${new Date().toISOString()}</h1>`)
  // );
}

export function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
