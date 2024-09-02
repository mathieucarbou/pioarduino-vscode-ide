/**
 * Copyright (c) 2017-present PlatformIO <contact@platformio.org>
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import { STATUS_BAR_PRIORITY_START } from './constants';
import { disposeSubscriptions } from './utils';
import { extension } from './main';
import vscode from 'vscode';

class ToolbarButton {
  constructor(text, tooltip, commands) {
    this.text = text;
    this.tooltip = tooltip;
    this.commands = ToolbarButtonCommands.from(commands);
  }

  createStatusBarItem(options = { priority: 0 }) {
    const item = vscode.window.createStatusBarItem(
      `pio-toolbar-${this.tooltip || this.text}`,
      vscode.StatusBarAlignment.Left,
      STATUS_BAR_PRIORITY_START + options.priority + 1,
    );
    item.name = this.tooltip || 'pioarduino: Toolbar Item';
    item.text = this.text;
    item.tooltip = this.tooltip;
    item.command = {
      title: this.tooltip,
      command: PIOToolbar.RUN_BUTTON_COMMANDS_ID,
      arguments: [this],
    };
    return item;
  }
}

class ToolbarButtonCommands {
  constructor(id, args = undefined) {
    this.id = id;
    this.args = args;
  }

  static from(rawCommands) {
    const result = [];
    if (!rawCommands) {
      return result;
    }
    if (!Array.isArray(rawCommands)) {
      rawCommands = [rawCommands];
    }
    return rawCommands.map((item) =>
      typeof item === 'object'
        ? new ToolbarButtonCommands(item.id, item.args)
        : new ToolbarButtonCommands(item),
    );
  }
}

export default class PIOToolbar {
  static RUN_BUTTON_COMMANDS_ID = 'platformio-ide.runToolbarButtonCommand';

  constructor(options = { filterCommands: undefined, ignoreCommands: undefined }) {
    this.options = options;
    this.subscriptions = [];
    this.show();
  }

  dispose() {
    disposeSubscriptions(this.subscriptions);
  }

  static getButtons() {
    const items = extension.getConfiguration('toolbar') || [];
    return items.map(
      (item) =>
        new ToolbarButton(
          item.text,
          item.tooltip,
          ToolbarButtonCommands.from(item.commands),
        ),
    );
  }

  show() {
    this.refresh();
  }

  refresh() {
    this.dispose();
    const buttons = PIOToolbar.getButtons().filter(
      (button) =>
        (!this.options.filterCommands ||
          button.commands.some((cmd) =>
            this.options.filterCommands.includes(cmd.id),
          )) &&
        (!this.options.ignoreCommands ||
          !button.commands.some((cmd) => this.options.ignoreCommands.includes(cmd.id))),
    );

    buttons.forEach((button, index) => {
      const sbItem = button.createStatusBarItem({ priority: buttons.length - index });
      sbItem.show();
      this.subscriptions.push(sbItem);
    });

    this.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) =>
        e.affectsConfiguration('platformio-ide.toolbar') ? this.refresh() : undefined,
      ),
      vscode.commands.registerCommand(
        PIOToolbar.RUN_BUTTON_COMMANDS_ID,
        this.onButtonClick.bind(this),
      ),
    );
  }

  async onButtonClick(button) {
    for (const cmd of button.commands) {
      let args = cmd.args || [];
      if (!Array.isArray(args)) {
        args = [args];
      }
      for (let i = 0; i < args.length; i++) {
        args[i] = await this._expandArgVariables(args[i]);
      }
      await vscode.commands.executeCommand(cmd.id, ...args);
    }
  }

  async _expandArgVariables(arg) {
    if (!arg.includes('${')) {
      return arg;
    }
    const matches = arg.match(/\$\{[^\}]+\}/g);
    for (const match of matches) {
      if (match.startsWith('${command:')) {
        arg = arg.replace(
          match,
          await vscode.commands.executeCommand(match.substring(10, match.length - 1)),
        );
      }
    }
    return arg;
  }
}
