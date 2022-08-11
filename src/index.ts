import * as Fs from 'fs';
import * as _ from 'lodash';
import { promisify } from 'util';
import { URL } from 'url';
import got from 'got';
import { resolve } from 'path';
import { pipeline } from 'stream';
import * as extract from 'extract-zip';
import { getBrowserData } from './browser';
import { getOS, isSupportedPlatform, isWin } from './os';
const cdnUrl =
  process.env.npm_config_edgedriver_cdnurl || process.env.EDGEDRIVER_CDNURL || 'https://msedgedriver.azureedge.net';
const mainDir = resolve(__dirname, '..');
const outFile = 'msedgedriver.zip';
const driverFolder = 'bin';
const edgePathFile = 'paths.json';

const pipelineAsync = promisify(pipeline);

const isStringHasValue = (value: string | undefined) => {
  return _.isString(value) && value.length > 0;
};

const getBrowser = async (edgeBinaryPath: string | undefined, edgeDriverVersion: string | undefined) => {
  if (isSupportedPlatform()) {
    if (
      edgeBinaryPath &&
      edgeDriverVersion &&
      isStringHasValue(edgeBinaryPath) &&
      isStringHasValue(edgeDriverVersion)
    ) {
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
        if (edgeDriverVersion && isStringHasValue(edgeDriverVersion)) {
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
  } else {
    process.stdout.write(`MS does not provide driver for your platform - ${process.platform}:${process.arch}\n`);
    process.exit(1);
  }
};

const downloadDriver = async (version: string) => {
  if (!/^(\d+\.\d+\.\d+\.\d+)$/g.test(version)) {
    const versionMatcher = version === 'LATEST' ? 'LATEST_STABLE' : `LATEST_RELEASE_${version.split('.')[0]}`;
    const response = await got.get(`${cdnUrl}/${versionMatcher}`);
    version = response.body.replace(/[^\d.]/g, '');
  }

  process.stdout.write(`Downloading MS Edge Driver ${version}...\n`);

  const downloadUrl = `${cdnUrl}/${version}/edgedriver_${getOS()}.zip`;
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
  const extractPath = resolve(mainDir, driverFolder);
  Fs.mkdirSync(extractPath, { recursive: true });

  await extract(resolve(downloadedFile), { dir: extractPath });
  process.stdout.write('Done. \n');
  // delete zip file
  Fs.unlinkSync(downloadedFile);

  const extracted = Fs.readdirSync(extractPath);

  const fileName = extracted.filter((name) => name.toLowerCase().includes('msedgedriver'))[0];

  return resolve(extractPath, fileName);
};

const findDriverInPath = () => {
  const driverPath = resolve(mainDir, driverFolder, isWin() ? 'msedgedriver.exe' : 'msedgedriver');
  return Fs.existsSync(driverPath) ? driverPath : null;
};

export const installDriver = async (): Promise<{ browserPath: string; driverPath: string }> => {
  const edgeBinaryPath = process.env.npm_config_edge_binary_path || process.env.EDGE_BINARY_PATH;
  const edgeDriverPath = process.env.npm_config_edgedriver_path || process.env.EDGEDRIVER_PATH;
  if (edgeBinaryPath && edgeDriverPath && isStringHasValue(edgeBinaryPath) && isStringHasValue(edgeDriverPath)) {
    return { browserPath: edgeBinaryPath, driverPath: edgeDriverPath };
  } else {
    const edgeDriverVersion = process.env.npm_config_edgedriver_version || process.env.EDGEDRIVER_VERSION;
    const forceDownload = process.env.npm_config_edgedriver_force_download || process.env.EDGEDRIVER_FORCE_DOWNLOAD;
    const binaryData = await getBrowser(edgeBinaryPath, edgeDriverVersion);

    if (binaryData) {
      let driverPath = findDriverInPath();

      if (forceDownload || !driverPath) {
        const isDowloaded = await downloadDriver(binaryData.version);
        driverPath = await getBinary(isDowloaded);
      }

      return { browserPath: binaryData.path, driverPath };
    } else {
      process.stdout.write(`Error getting browser data`);
      process.exit(1);
    }
  }
};

export const paths = (): { browserPath: string | undefined; driverPath: string | undefined } => {
  if (Fs.existsSync(edgePathFile)) {
    const rawdata = Fs.readFileSync(edgePathFile);
    return JSON.parse(rawdata.toString()) as { browserPath: string; driverPath: string };
  } else {
    const edgeBinaryPath = process.env.npm_config_edge_binary_path || process.env.EDGE_BINARY_PATH;
    const edgeDriverPath = process.env.npm_config_edgedriver_path || process.env.EDGEDRIVER_PATH;
    return { browserPath: edgeBinaryPath, driverPath: edgeDriverPath };
  }
};
