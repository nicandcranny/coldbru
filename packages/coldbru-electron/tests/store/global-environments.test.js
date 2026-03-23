const { globalEnvironmentsStore } = require('../../src/store/global-environments');
const { GlobalEnvironmentsManager } = require('../../src/store/workspace-environments');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Previously, a bug caused environment variables to be saved without a type.
// Since that issue is now fixed, this code ensures that anyone who imported
// data before the fix will have the missing types added retroactively.
describe('global environment variable type backward compatibility', () => {
  beforeEach(() => {
    globalEnvironmentsStore.store.clear();
  });

  it('should add type field for existing global environments without type', () => {
    // Mock global environments without type field
    const mockGlobalEnvironments = [
      {
        uid: 'yDlwWe3qgimPG20G7AbF7',
        name: 'Test Environment',
        variables: [
          {
            uid: 'b6BIHGaCrm4m97YA2dIdx',
            name: 'regular_var',
            value: 'regular_value',
            enabled: true,
            secret: false
            // Missing: type field
          },
          {
            uid: 'yQTqanPoMdRjKnHyIOZNc',
            name: 'secret_var',
            value: 'secret_value',
            enabled: true,
            secret: true
            // Missing: type field
          }
        ]
      }
    ];

    globalEnvironmentsStore.store.set('environments', mockGlobalEnvironments);

    const processedEnvironments = globalEnvironmentsStore.getGlobalEnvironments();

    expect(processedEnvironments).toHaveLength(1);
    expect(processedEnvironments[0].variables).toHaveLength(2);

    const regularVar = processedEnvironments[0].variables.find((v) => v.name === 'regular_var');
    const secretVar = processedEnvironments[0].variables.find((v) => v.name === 'secret_var');

    expect(regularVar.name).toBe('regular_var');
    expect(regularVar.type).toBe('text');

    expect(secretVar.name).toBe('secret_var');
    expect(secretVar.type).toBe('text');
  });

  it('should always return global environments sorted by name', () => {
    globalEnvironmentsStore.store.set('environments', [
      {
        uid: '123456789012345678903',
        name: 'zeta',
        variables: []
      },
      {
        uid: '123456789012345678901',
        name: 'Alpha',
        variables: []
      },
      {
        uid: '123456789012345678902',
        name: 'beta',
        variables: []
      }
    ]);

    const processedEnvironments = globalEnvironmentsStore.getGlobalEnvironments();

    expect(processedEnvironments.map((env) => env.name)).toEqual(['Alpha', 'beta', 'zeta']);
  });
});

describe('workspace-backed global environments ordering', () => {
  let workspacePath;

  beforeEach(() => {
    workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'bruno-workspace-envs-'));
    fs.writeFileSync(path.join(workspacePath, 'workspace.yml'), 'opencollection: 1.0.0\ninfo:\n  name: Test Workspace\n  type: workspace\n');

    const environmentsDir = path.join(workspacePath, 'environments');
    fs.mkdirSync(environmentsDir);
    fs.writeFileSync(path.join(environmentsDir, 'zeta.yml'), 'variables:\n  - name: baseUrl\n    value: https://zeta.example.com\n');
    fs.writeFileSync(path.join(environmentsDir, 'Alpha.yml'), 'variables:\n  - name: baseUrl\n    value: https://alpha.example.com\n');
    fs.writeFileSync(path.join(environmentsDir, 'beta.yml'), 'variables:\n  - name: baseUrl\n    value: https://beta.example.com\n');
  });

  afterEach(() => {
    fs.rmSync(workspacePath, { recursive: true, force: true });
  });

  it('should return workspace global environments sorted by name', async () => {
    const manager = new GlobalEnvironmentsManager();

    const { globalEnvironments } = await manager.getGlobalEnvironments(workspacePath);

    expect(globalEnvironments.map((env) => env.name)).toEqual(['Alpha', 'beta', 'zeta']);
  });
});
