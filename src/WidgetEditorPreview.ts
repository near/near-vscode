import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { window } from "vscode";
import { NearWidget } from "./NearWidget";
import { getWidget } from "./WidgetRegistry";

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

  static getOrCreate(widgetUri: vscode.Uri) {
    const existing =
      WidgetPreviewFactory.instance.previews[widgetUri.toString()];
    if (existing) {
      return existing;
    }
    const newPreview = WidgetPreview.create(
      WidgetPreviewFactory.instance.context,
      widgetUri,
      () => WidgetPreviewFactory.disposePreview(widgetUri),
    );
    WidgetPreviewFactory.instance.previews[widgetUri.toString()] = newPreview;
    return newPreview;
  }

  private static disposePreview(widgetUri: vscode.Uri) {
    delete WidgetPreviewFactory.instance.previews[widgetUri.toString()];
  }
}

export class WidgetPreview {
  public static readonly viewType = "WidgetPreview";

  readonly panel: vscode.WebviewPanel;
  readonly context: vscode.ExtensionContext;
  readonly uri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static create(
    extensionContext: vscode.ExtensionContext,
    uri: vscode.Uri,
    onDispose: () => void,
  ) {
    const column = vscode.ViewColumn.Beside;

    const panel = vscode.window.createWebviewPanel(
      WidgetPreview.viewType,
      '',
      column,
      getWebviewOptions(extensionContext.extensionUri)
    );
    const isDark = [vscode.ColorThemeKind.Dark, vscode.ColorThemeKind.Dark].includes(vscode.window.activeColorTheme.kind);
    panel.iconPath = vscode.Uri.joinPath(
      extensionContext.extensionUri,
      "media",
      isDark ? "near-dark.svg" : "near-light.svg",
    );
    const newPreview = new WidgetPreview(uri, panel, extensionContext, onDispose);
    return newPreview;
  }

  private constructor(
    uri: vscode.Uri,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    onDispose: () => void,
  ) {
    this.uri = uri;
    this.panel = panel;
    this.context = context;

    // Set the webview's initial html content
    this._update();

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
        console.log('changed state', e, this.panel.visible);
        if (this.panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "request-update-code":
            this.updateCode(getWidgetWithCode());
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public updateCode(code: string) {
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

  private _getTitle() {
    return `Preview ${this.uri.toString()}`;
  }

  private _update() {
    this.panel.title = this._getTitle();
    this.panel.webview.html = this._getHtmlForWebview(this.panel.webview);
  }

  private getPanelHtmlFileContent(context: vscode.ExtensionContext): string {
    const filePath: vscode.Uri = vscode.Uri.file(
      path.join(context.extensionPath, "media", "panel.html")
    );
    return fs.readFileSync(filePath.fsPath, "utf8");
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptPathOnDisk = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media",
      "main.js"
    );
    const styleResetPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media",
      "reset.css"
    );
    const stylesPathMainPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media",
      "vscode.css"
    );
    const html = this.getPanelHtmlFileContent(this.context)
      .replaceAll("{{cspSource}}", webview.cspSource)
      .replaceAll("{{nonce}}", getNonce())
      .replace("{{widgetCode}}", getWidgetWithCode())
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
    return html;
  }
}

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

function getWidgetUrl(network: string) {
  return network === "testnet"
    ? "https://test.near.social/#/embed/test_alice.testnet/widget/remote-code?code="
    : "https://near.social/#/embed/zavodil.near/widget/remote-code?code=";
}

export function getWidgetWithCode(widgetUriStr: string): string {
  const widget = getWidget(widgetUriStr);
  if (!widget || widget.code === null) {
    window.showErrorMessage(`Error loading preview: ${widgetUriStr}`);
    return `return <code>error</code>`;
  }
  const previewUrlPrefix = getWidgetUrl("mainnet");
  return previewUrlPrefix + encodeURIComponent(widget.code);
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
