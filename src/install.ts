import * as Fs from 'fs';
import * as _ from 'lodash';
import { promisify } from 'util';
import { URL } from 'url';
import got from 'got';
import { resolve } from 'path';
import { pipeline } from 'stream';
import * as extract from 'extract-zip';
import { getBrowserBinaryOnWin, getBrowserBinaryOnMac } from './browser';
const cdnUrl = process.env.EDGE_DRIVER_CDNURL || 'https://msedgedriver.azureedge.net';
const mainDir = resolve(__dirname, '..');
const outFile = 'msedgedriver.zip';
const platform: string = process.platform;
const arch: string = process.arch;
let edgeDriverVersion = process.env.npm_config_edge_driver_version || process.env.EDGE_DRIVER_VERSION;
let edgeBinaryPath = process.env.npm_config_edge_binary_path || process.env.EDGE_BINARY_PATH;
let edgeDriverPath = process.env.npm_config_edge_driver_path || process.env.EDGE_DRIVER_PATH;

const extractZipAsync = promisify(extract);
const pipelineAsync = promisify(pipeline);

enum OS {
  WIN32 = 'win32',
  WIN64 = 'win64',
  MAC32 = 'mac32',
  MAC64 = 'mac64',
  LINUX = 'linux',
}

const getOS = (): OS => {
  if (platform === 'win32') {
    return arch === 'x64' ? OS.WIN64 : OS.WIN32;
  } else if (platform === 'darwin') {
    return arch === 'x64' ? OS.MAC64 : OS.MAC32;
  } else {
    return OS.LINUX;
  }
};

const isBrowserBinaryDefined = () => !_.isEmpty(edgeBinaryPath);
const isDriverVersionDefined = () => !_.isEmpty(edgeDriverVersion);
const isDriverPathDefined = () => !_.isEmpty(edgeDriverPath);

const osName = getOS();

const isWin = (): boolean => {
  return [OS.WIN32, OS.WIN64].includes(osName);
};

const fileName = isWin() ? 'msedgedriver.exe' : 'msedgedriver';

const getBrowser = async () => {
  if (![OS.WIN32, OS.WIN64, OS.MAC64].includes(osName)) {
    process.stdout.write(`MS does not provide driver for ${osName} platform\n`);
    process.exit(1);
  }

  if (!isDriverVersionDefined()) {
    const binaryData = isWin() ? getBrowserBinaryOnWin() : await getBrowserBinaryOnMac(edgeBinaryPath);

    if (binaryData) {
      process.stdout.write(`Microsoft Edge installed. Version: ${binaryData.version}\n`);
      return binaryData;
    } else {
      return { path: '', version: 'LATEST' };
    }
  } else {
    process.stdout.write(`Microsoft Edge binary path is not provided\n`);
    return { path: '', version: 'LATEST' };
  }
};

const downloadDriver = async (version: string | undefined) => {
  if (version === 'LATEST') {
    process.stdout.write(`Getting the latest driver version\n`);
    const response = await got.get(`${cdnUrl}/LATEST_STABLE`);

    version = response.body.replace(/[^\d.]/g, '');
  }

  process.stdout.write(`Downloading MS Edge Driver ${version}...\n`);

  const downloadUrl = `${cdnUrl}/${version}/edgedriver_${osName}.zip`;
  const mainDir = resolve(__dirname, '..');
  const tempDownloadedFile = resolve(mainDir, outFile);
  try {
    await pipelineAsync(got.stream(new URL(downloadUrl)), Fs.createWriteStream(tempDownloadedFile));
    return true;
  } catch (err) {
    process.stdout.write(`${err}: ${downloadUrl}\n`);
    return false;
  }
};

const getBinary = async (downloaded: boolean) => {
  if (!downloaded) {
    process.stdout.write(`Driver was not downloaded\n`);
    process.exit(1);
  }

  process.stdout.write('Extracting driver binary... \n');
  const downloadedFile = resolve(mainDir, outFile);
  const extractPath = resolve(mainDir, 'bin');
  Fs.mkdirSync(extractPath, { recursive: true });

  await extractZipAsync(resolve(downloadedFile), { dir: extractPath });
  process.stdout.write('Done. \n');
  Fs.unlinkSync(downloadedFile);
  return resolve(extractPath, fileName);
};

const findDriverInPath = () => {
  const driverPath = resolve(mainDir, 'bin', fileName);
  return Fs.existsSync(driverPath) ? driverPath : null;
};

const installDriver = async () => {
  const binaryData = await getBrowser();
  let driverPath = findDriverInPath();
  if (!driverPath) {
    const isDowloaded = await downloadDriver(binaryData.version);
    driverPath = await getBinary(isDowloaded);
  }

  return { browserPath: binaryData.path, driverPath };
};

export { installDriver };
