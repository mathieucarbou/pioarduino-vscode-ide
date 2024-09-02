/**
 * Copyright (c) 2017-present PlatformIO <contact@platformio.org>
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import { CONFLICTED_EXTENSION_IDS } from './constants';
import { extension } from './main';
import vscode from 'vscode';

export async function maybeRateExtension() {
  const stateKey = 'rate-extension';
  const askAfterSessionNums = 13;
  let state = extension.context.globalState.get(stateKey);
  if (state && state.done) {
    return;
  } else if (!state || !state.callCounter) {
    state = {
      callCounter: 0,
      done: false,
    };
  }

  state.callCounter += 1;
  if (state.callCounter < askAfterSessionNums) {
    extension.context.globalState.update(stateKey, state);
    return;
  }

  const selectedItem = await vscode.window.showInformationMessage(
    'If you enjoy using pioarduino IDE for VSCode, would you mind taking a moment to rate it? ' +
      'It will not take more than one minute. Thanks for your support!',
    { title: 'Rate pioarduino IDE Extension', isCloseAffordance: false },
    { title: 'Remind later', isCloseAffordance: false },
    { title: 'No, Thanks', isCloseAffordance: true },
  );

  switch (selectedItem ? selectedItem.title : undefined) {
    case 'Rate pioarduino IDE Extension':
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.parse('https://bit.ly/4dxVF0M'),
      );
      state.done = true;
      break;
    case 'No, Thanks':
      state.done = true;
      break;
    default:
      state.callCounter = 0;
  }
  extension.context.globalState.update(stateKey, state);
}

export async function warnAboutConflictedExtensions() {
  const conflicted = vscode.extensions.all.filter(
    (ext) => ext.isActive && CONFLICTED_EXTENSION_IDS.includes(ext.id),
  );
  if (conflicted.length === 0) {
    return;
  }
  const selectedItem = await vscode.window.showWarningMessage(
    `Conflicted extensions with IntelliSense service were detected (${conflicted
      .map((ext) => ext.packageJSON.displayName || ext.id)
      .join(', ')}). ` +
      'Code-completion, linting and navigation will not work properly. ' +
      'Please disable or uninstall them (Menu > View > Extensions).',
    { title: 'More details', isCloseAffordance: false },
    { title: 'Uninstall conflicted', isCloseAffordance: false },
    { title: 'Remind later', isCloseAffordance: true },
  );
  switch (selectedItem ? selectedItem.title : undefined) {
    case 'More details':
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.parse('http://bit.ly/pio-vscode-conflicted-extensions'),
      );
      break;
    case 'Uninstall conflicted':
      conflicted.forEach((ext) => {
        vscode.commands.executeCommand(
          'workbench.extensions.uninstallExtension',
          ext.id,
        );
      });
      vscode.commands.executeCommand('workbench.action.reloadWindow');
      break;
  }
}

export async function warnAboutInoFile(editor) {
  if (!editor || !editor.document || !editor.document.fileName) {
    return;
  }
  if (!editor.document.fileName.endsWith('.ino')) {
    return;
  }
  const stateKey = 'ino-warn-disabled';
  if (extension.context.globalState.get(stateKey)) {
    return;
  }

  const selectedItem = await vscode.window.showWarningMessage(
    'C/C++ IntelliSense service does not support .INO files. ' +
      'It might lead to the spurious problems with code completion, linting, and debugging. ' +
      'Please convert .INO sketch into the valid .CPP file.',
    { title: 'Show instruction', isCloseAffordance: false },
    { title: 'Do not show again', isCloseAffordance: false },
    { title: 'Remind later', isCloseAffordance: true },
  );
  switch (selectedItem ? selectedItem.title : undefined) {
    case 'Show instruction':
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.parse('https://bit.ly/convert-ino-to-cpp'),
      );
      break;
    case 'Do not show again':
      extension.context.globalState.update(stateKey, 1);
      break;
  }
}
