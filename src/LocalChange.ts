import { Uri } from "vscode";
import { getWidget, getWidgetByFsUri } from "./NearWidget";
import { FS_EXT } from "./util";

const registry: Map<string, LocalChange> = new Map();
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
};

export const disposeChangeForWidget = (uri: string | string): void => {
  registry.delete(uri);
};

const persistLocalChanges = () => {};

export const reviveLocalChanges = () => {};
/**
 * Tracks local changes to the widget files.
 */
export class LocalChange {
  uri: Uri;
  content: Buffer | null = null;
  private constructor(uri: Uri) {
    this.uri = uri;
  }

  update(newContent: Buffer) {
    this.content = newContent;
  }

  static create(uri: string, content: Buffer): LocalChange {
    const newChange = new LocalChange(Uri.parse(uri));
    newChange.update(content);
    return newChange;
  }
}
