import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { LabIcon } from '@jupyterlab/ui-components';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IConsoleTracker } from '@jupyterlab/console';
import { KernelUsagePanel } from './panel';
import tachometer from '../style/tachometer.svg';

import { IStatusBar } from '@jupyterlab/statusbar';

import { ITranslator } from '@jupyterlab/translation';

import { MemoryUsage } from './memoryUsage';
import { DiskUsage } from './diskUsage';

import { KernelWidgetTracker } from './tracker';

namespace CommandIDs {
  export const getKernelUsage = 'kernel-usage:get';
}

/**
 * Initialization data for the jupyter-resource-usage extension.
 */
const memoryStatusPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-server/resource-usage:memory-status-item',
  autoStart: true,
  requires: [IStatusBar, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    statusBar: IStatusBar,
    translator: ITranslator
  ) => {
    const trans = translator.load('jupyter-resource-usage');
    const item = new MemoryUsage(trans);

    statusBar.registerStatusItem(memoryStatusPlugin.id, {
      item,
      align: 'left',
      rank: 2,
      isActive: () => item.model.metricsAvailable,
      activeStateChanged: item.model.stateChanged,
    });
  },
};

const diskStatusPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-server/resource-usage:disk-status-item',
  autoStart: true,
  requires: [IStatusBar, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    statusBar: IStatusBar,
    translator: ITranslator
  ) => {
    const trans = translator.load('jupyter-resource-usage');
    const item = new DiskUsage(trans);

    statusBar.registerStatusItem(diskStatusPlugin.id, {
      item,
      align: 'left',
      rank: 2,
      isActive: () => item.model.metricsAvailable,
      activeStateChanged: item.model.stateChanged,
    });
  },
};

const kernelUsagePlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-server/resource-usage:kernel-panel-item',
  autoStart: true,
  optional: [ICommandPalette, ILabShell, IConsoleTracker],
  requires: [ITranslator, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette | null,
    labShell: ILabShell | null,
    consoleTracker: IConsoleTracker | null
  ) => {
    const trans = translator.load('jupyter-resource-usage');

    const { commands, shell } = app;
    const category = trans.__('Kernel Resource');

    let panel: KernelUsagePanel | null = null;

    function createPanel() {
      if (!panel || panel.isDisposed) {
        const tracker = new KernelWidgetTracker({
          notebookTracker,
          labShell,
          consoleTracker,
        });

        panel = new KernelUsagePanel({
          currentChanged: tracker.currentChanged,
          trans: trans,
        });
        shell.add(panel, 'right', { rank: 200 });
      }
    }

    commands.addCommand(CommandIDs.getKernelUsage, {
      label: trans.__('Kernel Usage'),
      caption: trans.__('Kernel Usage'),
      icon: new LabIcon({
        name: 'jupyterlab-kernel-usage:icon',
        svgstr: tachometer,
      }),
      execute: createPanel,
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.getKernelUsage, category });
    }

    createPanel();
  },
};

const plugins: JupyterFrontEndPlugin<any>[] = [
  memoryStatusPlugin,
  diskStatusPlugin,
  kernelUsagePlugin,
];
export default plugins;
