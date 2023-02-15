import * as vscode from "vscode";
import {Uri} from "vscode";
import type {NearFS} from "./NearFS";
import {getWidget} from "./NearWidget";
import {GLOBAL_STORAGE_LOCAL_CHANGES_KEY} from "./util";

const registry: Map<string, LocalChange> = new Map();
let context: vscode.ExtensionContext;
let fileDecorations: DecorationProvider;
let nearFs: NearFS;
export const getDecorationsProvider = () => fileDecorations;
export const initLocalChangesRegistry = (
  ctx: vscode.ExtensionContext,
  fs: NearFS
) => {
  context = ctx;
  nearFs = fs;
  fileDecorations = new DecorationProvider();
  revive();
};

const hasDiffFromOriginal = async (uriStr: string, newChange: Buffer) => {
  const uri = vscode.Uri.parse(uriStr);
  if (uri) {
    try {
      const foundWidget = await nearFs.lookupWidget(uri);
      if (foundWidget) {
        const compare = Buffer.compare(newChange, foundWidget.code);
        return compare !== 0;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  } else {
    return false;
  }
};

export const getChangeForWidget = (uriStr: string): LocalChange | null => {
  const w = registry.get(uriStr);
  return w || null;
};

export const hasChange = (uriStr: string): boolean => {
  return registry.has(uriStr);
};

export const getChangesForPreview = () => {
  const changes: Record<string, { code: string }> = {};
  registry.forEach((change) => {
    if (change.content !== null) {
      const w = getWidget(change.uri.toString());
      if (w !== null) {
        changes[w.chainUri] = {
          code: change.content?.toString("utf-8"),
        };
      }
    }
  });
  return changes;
};

export const updateChangeForWidget = async (
  uri: string,
  content: Buffer
): Promise<void> => {
  if (registry.has(uri)) {
    const originalChanged = await hasDiffFromOriginal(uri, content);
    if (!originalChanged) {
      registry.delete(uri);
    } else {
      const existing = registry.get(uri);
      existing?.update(content);
    }
  } else {
    const newChange = LocalChange.create(uri, content);
    registry.set(uri, newChange);
  }
  fileDecorations.updateDecorations(uri);
  persist();
};

export const disposeChangeForWidget = (uri: string | string): void => {
  registry.delete(uri);
};

const persist = async () => {
  const toStore: [string, string][] = [];
  registry.forEach((c, k) => {
    if (c.contentStr !== null) {
      toStore.push([k, c.contentStr]);
    }
  });
  await context.globalState.update(GLOBAL_STORAGE_LOCAL_CHANGES_KEY, toStore);
  // context.globalState.update(GLOBAL_STORAGE_LOCAL_CHANGES_KEY, undefined);
};
const revive = () => {
  const stored = context.globalState.get<string>(
    GLOBAL_STORAGE_LOCAL_CHANGES_KEY
  ) as [string, string][] | undefined;
  if (stored) {
    stored.forEach(([uri, content]) => {
      const c = LocalChange.create(uri, Buffer.from(content));
      registry.set(uri, c);
    });
  }
};

/**
 * Tracks local changes to the widget files.
 */
export class LocalChange {
  uri: Uri;
  content: Buffer | null = null;
  original: Buffer | null = null;
  private constructor(uri: Uri) {
    this.uri = uri;
  }

  get contentStr(): string | null {
    return this.content ? this.content.toString("utf-8") : null;
  }

  update(newContent: Buffer) {
    this.content = newContent;
  }

  static create(uri: string, content: Buffer): LocalChange {
    const newChange = new LocalChange(Uri.parse(uri));
    newChange.update(content);
    return newChange;
  }

  toStorageStr() {
    return JSON.stringify({ uri: this.uri, content: this.contentStr });
  }
}

class DecorationProvider implements vscode.FileDecorationProvider {
  private readonly _onDidChangeDecorations = new vscode.EventEmitter<
    vscode.Uri[]
  >();
  readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri[]> =
    this._onDidChangeDecorations.event;
  provideFileDecoration(
    uri: vscode.Uri,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.FileDecoration> {
    if (hasChange(uri.toString())) {
      const decor: vscode.FileDecoration = {
        badge: "M",
        tooltip: "Modified locally",
        color: new vscode.ThemeColor(
          "gitDecoration.stageModifiedResourceForeground"
        ),
        propagate: true,
      };
      return decor;
    }
  }
  updateDecorations(uriStr: string) {
    const uri = vscode.Uri.parse(uriStr);
    if (uri) {
      this._onDidChangeDecorations.fire([uri]);
    }
  }
}
