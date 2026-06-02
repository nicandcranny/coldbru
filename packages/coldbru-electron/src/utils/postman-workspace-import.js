const fs = require('fs');
const path = require('path');

const getJsonFiles = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs.readdirSync(directoryPath)
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => path.join(directoryPath, entry));
};

const isPostmanWorkspaceExportDirectory = (directoryPath) => {
  const archivePath = path.join(directoryPath, 'archive.json');
  const collectionsDirectory = path.join(directoryPath, 'collection');
  const environmentsDirectory = path.join(directoryPath, 'environment');

  if (!fs.existsSync(archivePath)) {
    return false;
  }

  return getJsonFiles(collectionsDirectory).length > 0 || getJsonFiles(environmentsDirectory).length > 0;
};

const readPostmanWorkspaceExportDirectory = (directoryPath) => {
  if (!isPostmanWorkspaceExportDirectory(directoryPath)) {
    throw new Error('Invalid Postman export: archive.json or exported items not found');
  }

  const readJsonFile = (filePath) => {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  };

  const collections = getJsonFiles(path.join(directoryPath, 'collection')).map((filePath) => ({
    filePath,
    fileName: path.basename(filePath),
    content: readJsonFile(filePath)
  }));

  const environments = getJsonFiles(path.join(directoryPath, 'environment')).map((filePath) => ({
    filePath,
    fileName: path.basename(filePath),
    content: readJsonFile(filePath)
  }));

  return {
    collections,
    environments
  };
};

module.exports = {
  isPostmanWorkspaceExportDirectory,
  readPostmanWorkspaceExportDirectory
};
