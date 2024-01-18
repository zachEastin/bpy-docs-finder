import { log } from 'console';
import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('bpy-docs-finder.openBPYDoc', async () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showInformationMessage('No editor is active');
			return;
		}

		const selection = editor.selection;
		const position = selection.start;
		const document = editor.document;
		const text = document.getText(selection);

		if (!text) {
			vscode.window.showInformationMessage('No text is selected');
			return;
		}

		const locations = await vscode.commands.executeCommand<vscode.Location[]>(
			'vscode.executeDefinitionProvider',
			document.uri,
			position
		);

		if (!locations || locations.length === 0) {
			vscode.window.showInformationMessage('No definition found for the selected text');
			return;
		}

		// Get the first location
		const location = locations[0];

		// Get the text of the line where the definition is found
		const pyiFilePath = location.uri.with({ scheme: 'vscode' }).fsPath;

		// Read the .pyi file
		const pyiFileContent = fs.readFileSync(pyiFilePath, 'utf8');

		// Split the file content into lines
		const lines = pyiFileContent.split('\n');

		// Initialize variables to store the current class and whether the attribute is found
		let currentClass = null;
		let attributeFound = false;

		// Iterate over the lines
		for (const line of lines) {
			// Check if the line contains a class definition
			const classMatch = line.match(/class\s+(\w+)/);
			if (classMatch) {
				// If it does, update the current class
				currentClass = classMatch[1];
			}

			// Check if the line contains the selected attribute
			if (line.includes(text)) {
				// If it does, set attributeFound to true and break the loop
				attributeFound = true;
				break;
			}
		}

		if (!attributeFound || !currentClass) {
			vscode.window.showInformationMessage('No class found for the selected text');
			return;
		}
		
		const docUrl = `https://docs.blender.org/api/current/bpy.types.${currentClass}.html#bpy.types.${currentClass}.${text}`;
		
		// Open the URL in the default web browser
		vscode.env.openExternal(vscode.Uri.parse(docUrl));
	});	

	context.subscriptions.push(disposable);
}

export function deactivate() { }
