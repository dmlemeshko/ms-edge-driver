import * as Fs from 'fs';
import * as _ from 'lodash';
import { promisify } from 'util';
import { URL } from 'url';
import got from 'got';
import { resolve } from 'path';
import { pipeline } from 'stream';
import * as extract from 'extract-zip';
import { getBrowserData } from './browser';
import { osName, isSupportedPlatform, isWin } from './os';
const cdnUrl = process.env.EDGE_DRIVER_CDNURL || 'https://msedgedriver.azureedge.net';
const mainDir = resolve(__dirname, '..');
const outFile = 'msedgedriver.zip';
let edgeDriverVersion = process.env.npm_config_edge_driver_version || process.env.EDGE_DRIVER_VERSION;
let edgeBinaryPath = process.env.npm_config_edge_binary_path || process.env.EDGE_BINARY_PATH;
let edgeDriverPath = process.env.npm_config_edge_driver_path || process.env.EDGE_DRIVER_PATH;
const forceDownload = process.env.npm_config_edgedriver_force_download || process.env.EDGEDRIVER_FORCE_DOWNLOAD;
const edgePathFile = 'paths.json';

const extractZipAsync = promisify(extract);
const pipelineAsync = promisify(pipeline);

const isStringNotEmpty = (value: any) => {
  return typeof edgeDriverVersion !== 'undefined' && typeof value === 'string' && value.length > 0;
};

const isBrowserPathDefined = () => isStringNotEmpty(edgeBinaryPath);
const isVersionDefined = () => isStringNotEmpty(edgeDriverVersion);
const isDriverPathDefined = () => isStringNotEmpty(edgeDriverPath);

const getBrowser = async () => {
  if (!isSupportedPlatform()) {
    process.stdout.write(`MS does not provide driver for ${osName} platform\n`);
    process.exit(1);
  }

  if (typeof edgeBinaryPath !== 'undefined' && typeof edgeDriverVersion !== 'undefined') {
    return { path: edgeBinaryPath, version: edgeDriverVersion };
  } else {
    const data = await getBrowserData(edgeBinaryPath);
    if (data) {
      if (data.version) {
        process.stdout.write(`Microsoft Edge installed. Version: ${data.version}\n`);
      } else {
        process.stdout.write(`Microsoft Edge installed. Version is not recognized, using LATEST\n`);
        data.version = 'LATEST';
      }

      // override driver version if it is provided
      if (typeof edgeDriverVersion !== 'undefined') {
        process.stdout.write(`Custom driver version defined: ${edgeDriverVersion}\n`);
        data.version = edgeDriverVersion;
      }

      return data;
    } else {
      // failed to fetch binary data
      process.stdout.write(
        `Using defaults: edgeBinaryPath=${edgeBinaryPath} & edgeDriverVersion=${edgeDriverVersion}\n`,
      );
      return {
        path: typeof edgeBinaryPath !== 'undefined' ? edgeBinaryPath : '',
        version: typeof edgeDriverVersion !== 'undefined' ? edgeDriverVersion : 'LATEST',
      };
    }
  }
};

const downloadDriver = async (version: string) => {
  const versionMatcher = version === 'LATEST' ? 'LATEST_STABLE' : `LATEST_RELEASE_${version.split('.')[0]}`;
  const response = await got.get(`${cdnUrl}/${versionMatcher}`);

  version = response.body.replace(/[^\d.]/g, '');
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

const getBinary = async (downloaded: boolean, fileName: string) => {
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

const findDriverInPath = (fileName: string) => {
  const driverPath = resolve(mainDir, 'bin', fileName);
  return Fs.existsSync(driverPath) ? driverPath : null;
};

export const installDriver = async () => {
  if (isBrowserPathDefined() && isDriverPathDefined()) {
    return { browserPath: edgeBinaryPath, driverPath: edgeDriverPath };
  }

  const fileName = isWin() ? 'msedgedriver.exe' : 'msedgedriver';
  const binaryData = await getBrowser();
  let driverPath = findDriverInPath(fileName);

  if (forceDownload || !driverPath) {
    const isDowloaded = await downloadDriver(binaryData.version);
    driverPath = await getBinary(isDowloaded, fileName);
  }

  return { browserPath: binaryData.path, driverPath };
};

export const paths = () => {
  if (Fs.existsSync(edgePathFile)) {
    const rawdata = Fs.readFileSync(edgePathFile);
    return JSON.parse(rawdata.toString()) as { browserPath: string; driverPath: string };
  } else {
    return { browserPath: edgeBinaryPath, driverPath: edgeDriverPath };
  }
};
