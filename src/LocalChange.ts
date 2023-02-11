import * as vscode from "vscode";
import { Uri } from "vscode";
import { getWidget, getWidgetByFsUri } from "./NearWidget";
import { FS_EXT, GLOBAL_STORAGE_LOCAL_CHANGES_KEY } from "./util";

const registry: Map<string, LocalChange> = new Map();
let context: vscode.ExtensionContext;
export const initLocalChangesRegistry = (ctx: vscode.ExtensionContext) => {
  context = ctx;
  revive();
};

export const getChangeForWidget = (uriStr: string): LocalChange | null => {
  const w = registry.get(uriStr);
  return w || null;
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

export const updateChangeForWidget = (uri: string, content: Buffer): void => {
  if (registry.has(uri)) {
    registry.get(uri)?.update(content);
  } else {
    const newChange = LocalChange.create(uri, content);
    registry.set(uri, newChange);
  }
  persist();
};

export const disposeChangeForWidget = (uri: string | string): void => {
  registry.delete(uri);
};

const persist = () => {
  const toStore: [string, string][] = [];
  registry.forEach((c, k) => {
    if (c.contentStr !== null) {
      toStore.push([k, c.contentStr]);
    }
  });
  context.globalState.update(GLOBAL_STORAGE_LOCAL_CHANGES_KEY, toStore);
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

// let manager: LocalChangeManager;
// export class LocalChangeManager {
//   private static instance: LocalChangeManager;
//   private context: vscode.ExtensionContext;
//   private changes: Record<string, LocalChange> = {};

//   private constructor(context: vscode.ExtensionContext) {
//     this.context = context;
//   }
//   static onDocumentChange(widgetUri: string, code: Buffer) {}

//   static init(context: vscode.ExtensionContext) {
//     if (!manager) {
//       throw new Error("LocalChangeManager already initialized");
//     }
//     const newInstance = new LocalChangeManager(context);
//     manager = newInstance;
//   }
// }

/**
 * Tracks local changes to the widget files.
 */
export class LocalChange {
  uri: Uri;
  content: Buffer | null = null;
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
