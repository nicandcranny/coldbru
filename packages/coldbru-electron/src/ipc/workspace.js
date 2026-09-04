const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const archiver = require('archiver');
const AdmZip = require('adm-zip');
const {
  postmanToBruno,
  postmanToBrunoEnvironment
} = require('@usebruno/converters');
const { ipcMain, dialog } = require('electron');
const isDev = require('electron-is-dev');
const {
  createDirectory,
  sanitizeName,
  writeFile,
  DEFAULT_GITIGNORE
} = require('../utils/filesystem');
const yaml = require('js-yaml');
const LastOpenedWorkspaces = require('../store/last-opened-workspaces');
const {
  globalEnvironmentsManager
} = require('../store/workspace-environments');
const { importCollection } = require('../utils/collection-import');
const {
  isPostmanWorkspaceExportDirectory,
  readPostmanWorkspaceExportDirectory
} = require('../utils/postman-workspace-import');

const {
  createWorkspaceConfig,
  readWorkspaceConfig,
  writeWorkspaceConfig,
  validateWorkspaceConfig,
  updateWorkspaceDocs,
  addCollectionToWorkspace,
  removeCollectionFromWorkspace,
  reorderWorkspaceCollections,
  getWorkspaceCollections,
  normalizeCollectionEntry,
  validateWorkspacePath,
  validateWorkspaceDirectory,
  getWorkspaceUid,
  renameWorkspace
} = require('../utils/workspace-config');

const { isValidCollectionDirectory } = require('../utils/filesystem');

const prepareWorkspaceConfigForClient = (workspaceConfig, workspacePath) => {
  const collections = workspaceConfig.collections || [];
  const filteredCollections = collections
    .map((collection) => {
      if (collection.path && !path.isAbsolute(collection.path)) {
        return {
          ...collection,
          path: path.resolve(workspacePath, collection.path)
        };
      }
      return collection;
    })
    .filter(
      (collection) =>
        collection.path && isValidCollectionDirectory(collection.path)
    );

  return {
    ...workspaceConfig,
    collections: filteredCollections
  };
};

const getUniqueWorkspacePath = (extractLocation, workspaceName) => {
  const safeWorkspaceName = sanitizeName(workspaceName) || 'Imported-Workspace';
  let workspacePath = path.join(extractLocation, safeWorkspaceName);
  let counter = 1;

  while (fs.existsSync(workspacePath)) {
    workspacePath = path.join(
      extractLocation,
      `${safeWorkspaceName} (${counter})`
    );
    counter++;
  }

  return workspacePath;
};

const getUniqueEnvironmentName = (workspacePath, environmentName) => {
  const baseName = environmentName || 'Imported Environment';
  let nextName = baseName;
  let counter = 1;

  while (
    fs.existsSync(path.join(workspacePath, 'environments', `${nextName}.yml`))
  ) {
    nextName = `${baseName} (${counter})`;
    counter++;
  }

  return nextName;
};

const openImportedWorkspace = ({
  mainWindow,
  workspaceWatcher,
  lastOpenedWorkspaces,
  workspacePath
}) => {
  validateWorkspacePath(workspacePath);

  const workspaceConfig = readWorkspaceConfig(workspacePath);
  validateWorkspaceConfig(workspaceConfig);

  const workspaceUid = getWorkspaceUid(workspacePath);
  const configForClient = prepareWorkspaceConfigForClient(
    workspaceConfig,
    workspacePath
  );

  lastOpenedWorkspaces.add(workspacePath);
  mainWindow.webContents.send(
    'main:workspace-opened',
    workspacePath,
    workspaceUid,
    configForClient
  );

  if (workspaceWatcher) {
    workspaceWatcher.addWatcher(mainWindow, workspacePath);
  }

  return {
    success: true,
    workspaceConfig: configForClient,
    workspaceUid,
    workspacePath
  };
};

const importPostmanWorkspace = async ({
  extractedDirectory,
  zipFilePath,
  extractLocation,
  mainWindow
}) => {
  const { collections, environments }
    = readPostmanWorkspaceExportDirectory(extractedDirectory);

  if (collections.length === 0 && environments.length === 0) {
    throw new Error(
      'Postman export does not contain any collections or environments'
    );
  }

  const workspaceName
    = path.basename(zipFilePath, path.extname(zipFilePath))
      || 'Imported Postman Workspace';
  const workspacePath = getUniqueWorkspacePath(extractLocation, workspaceName);
  const collectionsPath = path.join(workspacePath, 'collections');
  let importedCollectionsCount = 0;
  let importedEnvironmentsCount = 0;

  try {
    validateWorkspaceDirectory(workspacePath);

    await createDirectory(workspacePath);
    await createDirectory(collectionsPath);

    const workspaceConfig = createWorkspaceConfig(workspaceName);
    await writeWorkspaceConfig(workspacePath, workspaceConfig);
    await writeFile(path.join(workspacePath, '.gitignore'), DEFAULT_GITIGNORE);

    for (const collectionFile of collections) {
      try {
        const brunoCollection = await postmanToBruno(collectionFile.content, {
          useWorkers: true
        });
        const importedCollection = await importCollection(
          brunoCollection,
          collectionsPath,
          mainWindow,
          null,
          'bru',
          { skipOpenEvent: true }
        );

        await addCollectionToWorkspace(workspacePath, {
          name:
            importedCollection.brunoConfig?.name
            || brunoCollection.name
            || path.basename(importedCollection.collectionPath),
          path: importedCollection.collectionPath
        });

        importedCollectionsCount++;
      } catch (error) {
        console.error(
          `Failed to import Postman collection ${collectionFile.fileName}:`,
          error
        );
      }
    }

    for (const environmentFile of environments) {
      try {
        const brunoEnvironment = postmanToBrunoEnvironment(
          environmentFile.content
        );
        const environmentName
          = sanitizeName(brunoEnvironment.name || 'Imported Environment')
            || 'Imported Environment';
        const uniqueEnvironmentName = getUniqueEnvironmentName(
          workspacePath,
          environmentName
        );

        await globalEnvironmentsManager.createGlobalEnvironment(workspacePath, {
          name: uniqueEnvironmentName,
          variables: brunoEnvironment.variables || [],
          color: brunoEnvironment.color
        });

        importedEnvironmentsCount++;
      } catch (error) {
        console.error(
          `Failed to import Postman environment ${environmentFile.fileName}:`,
          error
        );
      }
    }

    if (importedCollectionsCount === 0 && importedEnvironmentsCount === 0) {
      throw new Error(
        'Failed to import any collections or environments from Postman export'
      );
    }

    return workspacePath;
  } catch (error) {
    await fsExtra.remove(workspacePath).catch(() => {});
    throw error;
  }
};

const registerWorkspaceIpc = (mainWindow, workspaceWatcher) => {
  const lastOpenedWorkspaces = new LastOpenedWorkspaces();

  ipcMain.handle(
    'renderer:create-workspace',
    async (event, workspaceName, workspaceFolderName, workspaceLocation) => {
      try {
        workspaceFolderName = sanitizeName(workspaceFolderName);
        const dirPath = path.join(workspaceLocation, workspaceFolderName);

        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          if (files.length > 0) {
            throw new Error(
              `workspace: ${dirPath} already exists and is not empty`
            );
          }
        }

        validateWorkspaceDirectory(dirPath);

        if (!fs.existsSync(dirPath)) {
          await createDirectory(dirPath);
        }

        await createDirectory(path.join(dirPath, 'collections'));

        const workspaceUid = getWorkspaceUid(dirPath);
        const workspaceConfig = createWorkspaceConfig(workspaceName);

        await writeWorkspaceConfig(dirPath, workspaceConfig);
        await writeFile(path.join(dirPath, '.gitignore'), DEFAULT_GITIGNORE);

        lastOpenedWorkspaces.add(dirPath);

        const configForClient = prepareWorkspaceConfigForClient(
          workspaceConfig,
          dirPath
        );

        mainWindow.webContents.send(
          'main:workspace-opened',
          dirPath,
          workspaceUid,
          configForClient
        );

        if (workspaceWatcher) {
          workspaceWatcher.addWatcher(mainWindow, dirPath);
        }

        return {
          workspaceConfig: configForClient,
          workspaceUid,
          workspacePath: dirPath
        };
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle('renderer:open-workspace', async (event, workspacePath) => {
    try {
      validateWorkspacePath(workspacePath);

      const workspaceConfig = readWorkspaceConfig(workspacePath);
      validateWorkspaceConfig(workspaceConfig);

      const workspaceUid = getWorkspaceUid(workspacePath);
      const configForClient = prepareWorkspaceConfigForClient(
        workspaceConfig,
        workspacePath
      );

      lastOpenedWorkspaces.add(workspacePath);

      mainWindow.webContents.send(
        'main:workspace-opened',
        workspacePath,
        workspaceUid,
        configForClient
      );

      if (workspaceWatcher) {
        workspaceWatcher.addWatcher(mainWindow, workspacePath);
      }

      return {
        workspaceConfig: configForClient,
        workspaceUid,
        workspacePath
      };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('renderer:open-workspace-dialog', async (event) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Open Workspace',
        buttonLabel: 'Open Workspace'
      });

      if (canceled || filePaths.length === 0) {
        return null;
      }

      const workspacePath = filePaths[0];
      validateWorkspacePath(workspacePath);

      const workspaceConfig = readWorkspaceConfig(workspacePath);
      validateWorkspaceConfig(workspaceConfig);

      const workspaceUid = getWorkspaceUid(workspacePath);
      const configForClient = prepareWorkspaceConfigForClient(
        workspaceConfig,
        workspacePath
      );

      lastOpenedWorkspaces.add(workspacePath);

      mainWindow.webContents.send(
        'main:workspace-opened',
        workspacePath,
        workspaceUid,
        configForClient
      );

      if (workspaceWatcher) {
        workspaceWatcher.addWatcher(mainWindow, workspacePath);
      }

      return {
        workspaceConfig: configForClient,
        workspaceUid,
        workspacePath
      };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle(
    'renderer:load-workspace-collections',
    async (event, workspacePath) => {
      try {
        if (!workspacePath) {
          throw new Error('Workspace path is undefined');
        }

        validateWorkspacePath(workspacePath);
        return getWorkspaceCollections(workspacePath);
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:reorder-workspace-collections',
    async (event, workspacePath, collectionPaths) => {
      try {
        if (!workspacePath) {
          throw new Error('Workspace path is undefined');
        }
        validateWorkspacePath(workspacePath);
        await reorderWorkspaceCollections(workspacePath, collectionPaths);
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:load-workspace-apispecs',
    async (event, workspacePath) => {
      try {
        if (!workspacePath) {
          throw new Error('Workspace path is undefined');
        }

        const workspaceFilePath = path.join(workspacePath, 'workspace.yml');

        if (!fs.existsSync(workspaceFilePath)) {
          throw new Error('Invalid workspace: workspace.yml not found');
        }

        const yamlContent = fs.readFileSync(workspaceFilePath, 'utf8');
        const workspaceConfig = yaml.load(yamlContent);

        if (!workspaceConfig || typeof workspaceConfig !== 'object') {
          return [];
        }

        const specs = workspaceConfig.specs || [];

        const resolvedSpecs = specs
          .map((spec) => {
            if (spec.path && !path.isAbsolute(spec.path)) {
              return {
                ...spec,
                path: path.join(workspacePath, spec.path)
              };
            }
            return spec;
          })
          .filter((spec) => spec.path && fs.existsSync(spec.path));

        return resolvedSpecs;
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle('renderer:get-last-opened-workspaces', async () => {
    try {
      const workspacePaths = lastOpenedWorkspaces.getAll();
      const validWorkspaces = [];
      const invalidPaths = [];

      for (const workspacePath of workspacePaths) {
        const workspaceYmlPath = path.join(workspacePath, 'workspace.yml');

        if (fs.existsSync(workspaceYmlPath)) {
          validWorkspaces.push(workspacePath);
        } else {
          invalidPaths.push(workspacePath);
        }
      }

      for (const invalidPath of invalidPaths) {
        lastOpenedWorkspaces.remove(invalidPath);
      }

      return validWorkspaces;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle(
    'renderer:rename-workspace',
    async (event, workspacePath, newName) => {
      try {
        const result = await renameWorkspace(workspacePath, newName);

        if (result.newWorkspacePath) {
          if (workspaceWatcher) {
            workspaceWatcher.removeWatcher(workspacePath);
            workspaceWatcher.addWatcher(mainWindow, result.newWorkspacePath);
          }

          lastOpenedWorkspaces.remove(workspacePath);
          lastOpenedWorkspaces.add(result.newWorkspacePath);

          return { success: true, newWorkspacePath: result.newWorkspacePath };
        }

        return { success: true };
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle('renderer:close-workspace', async (event, workspacePath) => {
    try {
      lastOpenedWorkspaces.remove(workspacePath);

      if (workspaceWatcher) {
        workspaceWatcher.removeWatcher(workspacePath);
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle(
    'renderer:export-workspace',
    async (event, workspacePath, workspaceName) => {
      try {
        if (!workspacePath || !fs.existsSync(workspacePath)) {
          throw new Error('Workspace path does not exist');
        }

        const defaultFileName = `${sanitizeName(workspaceName)}.zip`;
        const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
          title: 'Export Workspace',
          defaultPath: defaultFileName,
          filters: [{ name: 'Zip Files', extensions: ['zip'] }]
        });

        if (canceled || !filePath) {
          return { success: false, canceled: true };
        }

        const ignoredDirectories = ['node_modules', '.git'];

        await new Promise((resolve, reject) => {
          const output = fs.createWriteStream(filePath);
          const archive = archiver('zip', { zlib: { level: 9 } });

          output.on('close', () => {
            resolve();
          });

          archive.on('error', (err) => {
            reject(err);
          });

          archive.pipe(output);

          const addDirectoryToArchive = (dirPath, archivePath) => {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const entry of entries) {
              const fullPath = path.join(dirPath, entry.name);
              const entryArchivePath = archivePath
                ? path.join(archivePath, entry.name)
                : entry.name;

              if (entry.isDirectory()) {
                if (!ignoredDirectories.includes(entry.name)) {
                  addDirectoryToArchive(fullPath, entryArchivePath);
                }
              } else {
                archive.file(fullPath, { name: entryArchivePath });
              }
            }
          };

          addDirectoryToArchive(workspacePath, '');
          archive.finalize();
        });

        return { success: true, filePath };
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:import-workspace',
    async (event, zipFilePath, extractLocation) => {
      try {
        if (!zipFilePath || !fs.existsSync(zipFilePath)) {
          throw new Error('Zip file does not exist');
        }

        if (!extractLocation || !fs.existsSync(extractLocation)) {
          throw new Error('Extract location does not exist');
        }

        const tempDir = path.join(extractLocation, `_bruno_temp_${Date.now()}`);
        await fsExtra.ensureDir(tempDir);

        try {
          const zip = new AdmZip(zipFilePath);
          zip
            .getEntries()
            .filter(
              ({ entryName }) =>
                entryName === '__MACOSX' || entryName.startsWith('__MACOSX/')
            )
            .forEach(({ entryName }) => zip.deleteFile(entryName));
          zip.extractAllTo(tempDir);

          const extractedItems = fs.readdirSync(tempDir);
          let importedDir = tempDir;

          if (extractedItems.length === 1) {
            const singleItem = path.join(tempDir, extractedItems[0]);
            if (fs.statSync(singleItem).isDirectory()) {
              importedDir = singleItem;
            }
          }

          const workspaceYmlPath = path.join(importedDir, 'workspace.yml');
          let finalWorkspacePath;

          if (fs.existsSync(workspaceYmlPath)) {
            const workspaceConfig = yaml.load(
              fs.readFileSync(workspaceYmlPath, 'utf8')
            );
            const workspaceName
              = workspaceConfig.info.name || 'Imported Workspace';
            finalWorkspacePath = getUniqueWorkspacePath(
              extractLocation,
              workspaceName
            );

            if (importedDir !== tempDir) {
              await fsExtra.move(importedDir, finalWorkspacePath);
              await fsExtra.remove(tempDir);
            } else {
              await fsExtra.move(tempDir, finalWorkspacePath);
            }
          } else if (isPostmanWorkspaceExportDirectory(importedDir)) {
            finalWorkspacePath = await importPostmanWorkspace({
              extractedDirectory: importedDir,
              zipFilePath,
              extractLocation,
              mainWindow
            });
            await fsExtra.remove(tempDir);
          } else {
            throw new Error(
              'Invalid workspace import: zip must contain either workspace.yml or a Postman workspace export'
            );
          }

          return openImportedWorkspace({
            mainWindow,
            workspaceWatcher,
            lastOpenedWorkspaces,
            workspacePath: finalWorkspacePath
          });
        } catch (error) {
          await fsExtra.remove(tempDir).catch(() => {});
          throw error;
        }
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:save-workspace-docs',
    async (_event, workspacePath, docs) => {
      try {
        return await updateWorkspaceDocs(workspacePath, docs);
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:load-workspace-environments',
    async (_event, workspacePath) => {
      try {
        const result
          = await globalEnvironmentsManager.getGlobalEnvironments(workspacePath);
        return result.globalEnvironments;
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:create-workspace-environment',
    async (_event, workspacePath, environmentName) => {
      try {
        return await globalEnvironmentsManager.createGlobalEnvironment(
          workspacePath,
          {
            name: environmentName,
            variables: []
          }
        );
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:delete-workspace-environment',
    async (_event, workspacePath, environmentUid) => {
      try {
        return await globalEnvironmentsManager.deleteGlobalEnvironment(
          workspacePath,
          { environmentUid }
        );
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:select-workspace-environment',
    async (_event, workspacePath, environmentUid) => {
      try {
        return await globalEnvironmentsManager.selectGlobalEnvironment(
          workspacePath,
          { environmentUid }
        );
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:import-workspace-environment',
    async (_event, workspacePath, environmentData) => {
      try {
        return await globalEnvironmentsManager.createGlobalEnvironment(
          workspacePath,
          {
            name: environmentData.name || 'Imported Environment',
            variables: environmentData.variables || []
          }
        );
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:update-workspace-environment',
    async (_event, workspacePath, environmentUid, environmentData) => {
      try {
        return await globalEnvironmentsManager.saveGlobalEnvironment(
          workspacePath,
          {
            environmentUid,
            variables: environmentData.variables || []
          }
        );
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:rename-workspace-environment',
    async (_event, workspacePath, environmentUid, newName) => {
      try {
        return await globalEnvironmentsManager.renameGlobalEnvironment(
          workspacePath,
          {
            environmentUid,
            name: newName
          }
        );
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:copy-workspace-environment',
    async (_event, workspacePath, environmentUid, newName) => {
      try {
        const result
          = await globalEnvironmentsManager.getGlobalEnvironments(workspacePath);
        const sourceEnv = result.globalEnvironments.find(
          (env) => env.uid === environmentUid
        );

        if (!sourceEnv) {
          throw new Error('Source environment not found');
        }

        // Create new environment with copied variables
        return await globalEnvironmentsManager.createGlobalEnvironment(
          workspacePath,
          {
            name: newName,
            variables: sourceEnv.variables || []
          }
        );
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:add-collection-to-workspace',
    async (_event, workspacePath, collection) => {
      try {
        const normalizedCollection = normalizeCollectionEntry(
          workspacePath,
          collection
        );
        const updatedCollections = await addCollectionToWorkspace(
          workspacePath,
          normalizedCollection
        );

        const workspaceConfig = readWorkspaceConfig(workspacePath);
        const workspaceUid = getWorkspaceUid(workspacePath);
        const configForClient = prepareWorkspaceConfigForClient(
          workspaceConfig,
          workspacePath
        );
        mainWindow.webContents.send(
          'main:workspace-config-updated',
          workspacePath,
          workspaceUid,
          configForClient
        );

        return updatedCollections;
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:ensure-collections-folder',
    async (_event, workspacePath) => {
      try {
        const collectionsPath = path.join(workspacePath, 'collections');
        if (!fs.existsSync(collectionsPath)) {
          await createDirectory(collectionsPath);
        }
        return collectionsPath;
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:start-workspace-watcher',
    async (_event, workspacePath) => {
      try {
        if (workspaceWatcher) {
          workspaceWatcher.addWatcher(mainWindow, workspacePath);
        }
        return true;
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:remove-collection-from-workspace',
    async (
      _event,
      _workspaceUid,
      workspacePath,
      collectionPath,
      options = {}
    ) => {
      try {
        const { deleteFiles = false } = options;
        const result = await removeCollectionFromWorkspace(
          workspacePath,
          collectionPath
        );

        if (
          deleteFiles
          && result.removedCollection
          && fs.existsSync(collectionPath)
        ) {
          await fsExtra.remove(collectionPath);
        }

        const correctWorkspaceUid = getWorkspaceUid(workspacePath);
        const configForClient = prepareWorkspaceConfigForClient(
          result.updatedConfig,
          workspacePath
        );
        mainWindow.webContents.send(
          'main:workspace-config-updated',
          workspacePath,
          correctWorkspaceUid,
          configForClient
        );

        return true;
      } catch (error) {
        throw error;
      }
    }
  );

  ipcMain.handle(
    'renderer:get-collection-workspaces',
    async (_event, collectionPath) => {
      try {
        const workspacePaths = lastOpenedWorkspaces.getAll();
        const workspacesWithCollection = [];

        for (const workspacePath of workspacePaths) {
          try {
            const workspaceYmlPath = path.join(workspacePath, 'workspace.yml');
            if (fs.existsSync(workspaceYmlPath)) {
              const workspaceConfig
                = yaml.load(fs.readFileSync(workspaceYmlPath, 'utf8')) || {};
              const collections = workspaceConfig.collections || [];

              const hasCollection = collections.some((c) => {
                const resolvedPath = path.isAbsolute(c.path)
                  ? c.path
                  : path.resolve(workspacePath, c.path);
                return resolvedPath === collectionPath;
              });

              if (hasCollection) {
                workspacesWithCollection.push(workspacePath);
              }
            }
          } catch (error) {
            console.warn(
              'Failed to check workspace collection:',
              error.message
            );
          }
        }

        return workspacesWithCollection;
      } catch (error) {
        return [];
      }
    }
  );

  // Guard to prevent main:renderer-ready from running multiple times (only needed in dev mode due to strict mode)
  let rendererReadyProcessed = false;

  ipcMain.on('main:renderer-ready', async (win) => {
    if (isDev && rendererReadyProcessed) {
      return;
    }
    rendererReadyProcessed = true;

    try {
      const workspacePaths = lastOpenedWorkspaces.getAll();
      const invalidPaths = [];

      for (const workspacePath of workspacePaths) {
        const workspaceYmlPath = path.join(workspacePath, 'workspace.yml');

        if (fs.existsSync(workspaceYmlPath)) {
          try {
            const workspaceConfig = readWorkspaceConfig(workspacePath);
            validateWorkspaceConfig(workspaceConfig);
            const workspaceUid = getWorkspaceUid(workspacePath);
            const configForClient = prepareWorkspaceConfigForClient(
              workspaceConfig,
              workspacePath
            );

            win.webContents.send(
              'main:workspace-opened',
              workspacePath,
              workspaceUid,
              configForClient
            );

            if (workspaceWatcher) {
              workspaceWatcher.addWatcher(win, workspacePath);
            }
          } catch (error) {
            console.error(`Error loading workspace ${workspacePath}:`, error);
            invalidPaths.push(workspacePath);
          }
        } else {
          invalidPaths.push(workspacePath);
        }
      }

      for (const invalidPath of invalidPaths) {
        lastOpenedWorkspaces.remove(invalidPath);
      }
    } catch (error) {
      console.error('Error initializing workspaces:', error);
    }
  });
};

module.exports = registerWorkspaceIpc;
