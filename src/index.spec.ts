import { installDriver } from '.';
import { mockProcessExit, mockProcessStdout } from 'jest-mock-process';
import { resolve } from 'path';
import * as Fs from 'fs';

const binPath = resolve(__dirname, '..', 'bin');
const filePath = resolve(binPath, 'msedgedriver');

const cleanup = () => {
  if (Fs.existsSync(filePath)) {
    Fs.unlinkSync(filePath);
  }
  if (Fs.existsSync(binPath)) {
    Fs.rmdirSync(binPath, { recursive: true });
  }
};

describe('Running module on non-supported platform', function () {
  let mockStdout: jest.SpyInstance;
  let mockExit: jest.SpyInstance;
  const orginalOS = process.platform;
  const notSupportedOS = 'mac32';

  beforeAll(function () {
    // redefine process.platform
    Object.defineProperty(process, 'platform', {
      value: notSupportedOS,
    });
  });
  afterAll(function () {
    // restore original process.platform
    Object.defineProperty(process, 'platform', {
      value: orginalOS,
    });
    mockStdout.mockRestore();
    mockExit.mockRestore();
  });

  test('should exit with 1 and correct messages', async function () {
    mockExit = mockProcessExit();
    mockStdout = mockProcessStdout();
    const paths = await installDriver();
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(paths).toEqual(undefined);
    expect(mockStdout).toBeCalledTimes(2);
    expect(mockStdout.mock.calls).toEqual([
      [`MS does not provide driver for your platform - ${notSupportedOS}:${process.arch}\n`],
      ['Error getting browser data'],
    ]);
  });
});

describe('Setting explicitly browser and driver path', () => {
  const browserPath = 'c://Edge.exe';
  const driverPath = 'c://msedgedriver.exe';

  beforeAll(() => {
    process.env = Object.assign(process.env, { EDGE_BINARY_PATH: browserPath, EDGEDRIVER_PATH: driverPath });
  });

  test('should return correct paths without download', async () => {
    const paths = await installDriver();
    expect(Fs.existsSync(filePath)).toBeFalsy();
    expect(paths).toEqual({ browserPath, driverPath });
  });

  afterAll(() => {
    process.env = Object.assign(process.env, { EDGE_BINARY_PATH: '', EDGEDRIVER_PATH: '' });
  });
});

describe('Downloading driver', () => {
  let mockStdout: jest.SpyInstance;
  const majorVersion = '85';
  const fullVersion = '85.0.564.63';

  beforeEach(() => {
    cleanup();
  });

  test(
    'should download driver and return correct paths',
    async () => {
      mockStdout = mockProcessStdout();
      const paths = await installDriver();
      expect(Fs.existsSync(filePath)).toBeTruthy();
      expect(paths).toEqual({
        browserPath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        driverPath: filePath,
      });
      expect(mockStdout).toBeCalledTimes(4);
    },
    60 * 1000,
  );

  test(
    'should download driver with major version and return correct paths',
    async () => {
      mockStdout = mockProcessStdout();
      process.env.EDGEDRIVER_VERSION = majorVersion;
      const paths = await installDriver();
      expect(Fs.existsSync(filePath)).toBeTruthy();
      expect(paths).toEqual({
        browserPath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        driverPath: filePath,
      });
      expect(mockStdout).toBeCalledTimes(5);
      expect(mockStdout.mock.calls.toString()).toContain(`Custom driver version defined: ${majorVersion}`);
      expect(mockStdout.mock.calls.toString()).toContain(`Downloading MS Edge Driver ${majorVersion}`);
    },
    60 * 1000,
  );

  test(
    'should download driver with full version and return correct paths',
    async () => {
      mockStdout = mockProcessStdout();
      process.env.EDGEDRIVER_VERSION = fullVersion;
      const paths = await installDriver();
      expect(Fs.existsSync(filePath)).toBeTruthy();
      expect(paths).toEqual({
        browserPath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        driverPath: filePath,
      });
      expect(mockStdout).toBeCalledTimes(5);
      expect(mockStdout.mock.calls.toString()).toContain(`Custom driver version defined: ${fullVersion}`);
      expect(mockStdout.mock.calls.toString()).toContain(`Downloading MS Edge Driver ${fullVersion}...`);
    },
    60 * 1000,
  );

  afterEach(() => {
    cleanup();
    mockStdout.mockRestore();
    process.env.EDGEDRIVER_VERSION = '';
  });
});
