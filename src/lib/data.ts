import * as vscode from 'vscode';
import { posix } from 'path';

export interface Mark {
  id: string;
  key: string;
  description: string;
  codeLens: string;
  comment: string;
}

const FOLDER_NAME = '.codemarks';
const STATE_FILE_NAME = 'state.json';

export const MarksDB = new Proxy(new Map<string, Mark>(), {
  get(target, property, receiver) {
    const key = String(property);

    let actual = Reflect.get(target, property, receiver);

    if (typeof actual === "function") {
      actual = actual.bind(target);
    }

    if (typeof actual === "function" && key === "set" || key === "delete") {
      return (...args: any[]) => {
        const result = actual(...args);
        writeStateToDisk().catch(console.error);
        return result;
      };
    }

    return actual;
  },
});

async function getStateFileUri() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showInformationMessage('No folder or workspace opened');
    return null;
  }

  const folderUri = vscode.workspace.workspaceFolders[0]?.uri;

  if (!folderUri) {
    vscode.window.showInformationMessage('No folder or workspace opened');
    return null;
  }

  const rootFolder = folderUri.with({ path: posix.join(folderUri.path, FOLDER_NAME) });
  const fileUri = folderUri.with({ path: posix.join(folderUri.path, FOLDER_NAME, STATE_FILE_NAME) });

  await vscode.workspace.fs.createDirectory(rootFolder);

  // check if file exists
  let exists = false;

  try {
    await vscode.workspace.fs.stat(fileUri);
    exists = true;
  } catch (e) {
    exists = false;
  }

  if (!exists) {
    const writeStr = JSON.stringify({ marks: [] });
    const writeData = Buffer.from(writeStr, 'utf8');
    await vscode.workspace.fs.writeFile(fileUri, writeData);
  }

  return fileUri;
}

export async function loadStateFromDisk() {
  const fileUri = await getStateFileUri();

  if (fileUri) {
    const readData = await vscode.workspace.fs.readFile(fileUri);
    const readStr = Buffer.from(readData).toString('utf8');

    const state = JSON.parse(readStr);

    if (state.marks) {
      for (const mark of state.marks) {
        MarksDB.set(mark.key, mark);
      }
    }
  }
}

async function writeStateToDisk() {
  const fileUri = await getStateFileUri();

  if (fileUri) {
    const writeStr = JSON.stringify({ marks: Array.from(MarksDB.values()) });
    const writeData = Buffer.from(writeStr, 'utf8');
    await vscode.workspace.fs.writeFile(fileUri, writeData);
  }
}