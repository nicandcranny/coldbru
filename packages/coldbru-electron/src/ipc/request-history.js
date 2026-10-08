const { ipcMain } = require('electron');
const { addEntry, getSummaries, getEntry, clearEntries } = require('../store/request-history');

const registerRequestHistoryIpc = () => {
  ipcMain.handle('renderer:get-request-history', () => getSummaries());

  ipcMain.handle('renderer:get-request-history-entry', (event, id) => getEntry(id));

  ipcMain.handle('renderer:add-request-history', (event, entry) => addEntry(entry));

  ipcMain.handle('renderer:clear-request-history', () => clearEntries());
};

module.exports = registerRequestHistoryIpc;
