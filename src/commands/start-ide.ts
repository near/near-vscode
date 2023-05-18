import * as vscode from "vscode";
import { defaultContext } from "../config";
import path from "path";
import * as fs from "fs";

export const startIDE = async (localWorkspace: string) => {
  vscode.commands.executeCommand('setContext', 'BOS.enabled', true);

  const files = ["props.json", "context.json", "flags.json"];
  const defaultValues = ["{}", JSON.stringify(defaultContext), "{}"];

  for (let i = 0; i < files.length; i++) {
    const file = path.join(localWorkspace, files[i]);
    
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, defaultValues[i]);
    }
  }
};