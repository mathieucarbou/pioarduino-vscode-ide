/**
 * Copyright (c) 2017-present PlatformIO <contact@platformio.org>
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import * as vscode from 'vscode';

class QuickItem extends vscode.TreeItem {
  constructor(label, command, args, collapsibleState, children) {
    super(label, collapsibleState);
    if (command) {
      this.command = {
        title: label,
        command,
        arguments: args,
      };
    }
    this.customChildren = children;
  }
}

export default class QuickAccessTreeProvider {
  getChildren(element) {
    if (element && element.customChildren) {
      return element.customChildren;
    }
    return [
      new QuickItem(
        'PIO Home',
        undefined,
        undefined,
        vscode.TreeItemCollapsibleState.Expanded,
        [
          new QuickItem('Open', 'platformio-ide.showHome'),
          new QuickItem('PIO Account', 'platformio-ide.showHome', ['/account']),
          new QuickItem('Inspect', 'platformio-ide.showHome', ['/inspect']),
          new QuickItem('Projects & Configuration', 'platformio-ide.showHome', [
            '/projects',
          ]),
          new QuickItem('Libraries', 'platformio-ide.showHome', ['/libraries']),
          new QuickItem('Boards', 'platformio-ide.showHome', ['/boards']),
          new QuickItem('Platforms', 'platformio-ide.showHome', ['/platforms']),
          new QuickItem('Devices', 'platformio-ide.showHome', ['/device']),
        ],
      ),
      new QuickItem(
        'Debug',
        undefined,
        undefined,
        vscode.TreeItemCollapsibleState.Expanded,
        [
          new QuickItem('Start Debugging', 'platformio-ide.startDebugging'),
          new QuickItem('Toggle Debug Console', 'workbench.debug.action.toggleRepl'),
        ],
      ),
      new QuickItem(
        'Miscellaneous',
        undefined,
        undefined,
        vscode.TreeItemCollapsibleState.Expanded,
        [
          new QuickItem(
            'Serial & UDP Plotter',
            'workbench.extensions.action.showExtensionsWithIds',
            [['alexnesnes.teleplot']],
          ),
          new QuickItem('pioarduino Core CLI', 'platformio-ide.openPIOCoreCLI'),
          new QuickItem('Clone Git Project', 'git.clone'),
          new QuickItem('New Terminal', 'platformio-ide.newTerminal'),
          new QuickItem('Upgrade pioarduino Core', 'platformio-ide.upgradeCore'),
        ],
      ),
    ];
  }

  getTreeItem(element) {
    return element;
  }
}
