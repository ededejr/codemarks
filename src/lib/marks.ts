import { window, commands, ExtensionContext } from 'vscode';
import { Mark, MarksDB } from './utils';

/**
 * Active the core features for the extension.
 */
export function activateMarks(context: ExtensionContext) {
	context.subscriptions.push(commands.registerCommand('codemarks.createMark', async () => {
		const quickPick = window.createQuickPick();
		quickPick.items = [
      {
        label: 'Create a new mark',
      },
      ...Array.from(MarksDB.values()).map(mark => ({ label: mark.id, description: mark.description }))
    ];
		quickPick.onDidChangeSelection(selection => {
			if (selection[0] && selection[0].label !== 'Create a new mark') {
        const mark = MarksDB.get(selection[0].description || '') as Mark;
        if (mark) {
          insertMarkInEditor(mark).catch(console.error);
        } else {
          window.showErrorMessage(`Could not find mark ${selection[0].label}`);
        }
        quickPick.hide();
			} else {
        showCreateMarkInput().catch(console.error);
      }
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	}));
}

async function createMark(key: string) {
  if (MarksDB.has(key)) {
    return MarksDB.get(key) as Mark;
  }

  const id = `MK${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  const mark = {
    id,
    key,
    description: key,
    codeLens: `Codemark: ${key}`,
    comment: `// @${id}`,
  };

  MarksDB.set(key, mark);
  return mark;
}

async function insertMarkInEditor(mark: Mark) {
  const editor = window.activeTextEditor;

  if (!editor) {
    return;
  }

  const { selection } = editor;

  if (!selection) {
    return;
  }

  await editor.edit(editBuilder => {
    editBuilder.replace(selection, mark.comment);
  });
}

/**
 * Shows an input box for the description using window.showInputBox().
 */
async function showCreateMarkInput() {
	const result = await window.showInputBox({
    title: 'Create a new mark',
		placeHolder: 'Enter a description for the mark',
		valueSelection: [2, 4],
		validateInput: text => {
      const isTooShort = text.length < 3;

      if (isTooShort) {
        return 'Mark description must be at least 3 characters long';
      }

			return null;
		}
	});

  if (result) {
    const mark = await createMark(result);
    await insertMarkInEditor(mark);

    window.showInformationMessage(`Created mark ${mark.id}`);
  }
}
