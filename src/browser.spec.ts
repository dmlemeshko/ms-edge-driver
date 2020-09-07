import { getBrowserData } from './browser';
import { mockProcessStdout } from 'jest-mock-process';

describe('Fetching browser binary', function () {
  let mockStdout: jest.SpyInstance;
  const edgeWrongPath = '/local/Applications/Edge';

  test('should return correct path and version', async function () {
    mockStdout = mockProcessStdout();
    const binaryData = await getBrowserData();
    expect(binaryData).toHaveProperty('path', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
    expect(binaryData).toHaveProperty('version');
    expect(binaryData?.version).toBeDefined();
    expect(mockStdout).toBeCalledTimes(0);
  }, 30000);

  test('should return undefined and error message with incorrect path', async function () {
    mockStdout = mockProcessStdout();
    const binaryData = await getBrowserData(edgeWrongPath);
    expect(binaryData).toEqual(undefined);
    expect(mockStdout).toBeCalledTimes(1);
    expect(mockStdout.mock.calls).toEqual([
      [`MS Edge browser is not found in Applications: /bin/sh: ${edgeWrongPath}: No such file or directory\n \n`],
    ]);
  });

  afterAll(function () {
    mockStdout.mockRestore();
  });
});
