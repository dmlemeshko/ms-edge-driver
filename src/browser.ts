import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { isWin } from './os';
const execAsync = promisify(exec);
const DEFAULT_EDGE_BINARY_PATH = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const DEFAULT_EDGE_HKEY =
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{56EB18F8-B008-4CBD-B6D2-8C97FE7E9062}';

type RegistryKey = { values: { location: { value: string }; pv: { value: string } } };

const getRegistryKey = async (key: string): Promise<RegistryKey> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const regedit = require('regedit');
    regedit.list(key as string, (err: NodeJS.ErrnoException | null, result: { [key: string]: RegistryKey }) => {
      if (err) {
        return reject(err);
      } else {
        resolve(result[key]);
      }
    });
  });
};

const getBrowserBinaryOnWin = async () => {
  const fileName = 'msedge.exe';
  const edgeBinaryHKey = process.env.EDGE_HKEY || DEFAULT_EDGE_HKEY;
  try {
    const key = await getRegistryKey(edgeBinaryHKey);
    const path = key.values.location.value;
    const version = key.values.pv.value;
    return { path: join(path, fileName), version };
  } catch (err: any) {
    process.stdout.write(`MS Edge browser is not found in registry: ${err?.stderr} \n`);
  }
};

const getBrowserBinaryOnMac = async (edgeBinaryPath?: string | undefined) => {
  const binaryPath =
    typeof edgeBinaryPath === 'string' && edgeBinaryPath.length > 0 ? edgeBinaryPath : DEFAULT_EDGE_BINARY_PATH;
  try {
    const { stdout } = await execAsync(`"${binaryPath}" --version`);
    const found = stdout.toString().match(/\d{1,}.\d{1,}.\d{1,}.\d{1,}/g);
    if (found) {
      return { path: binaryPath, version: found[0] };
    }
  } catch (err: any) {
    process.stdout.write(`MS Edge browser is not found in Applications: ${err?.stderr} \n`);
  }
};

const getBrowserBinaryOnLinux = async () => {
  try {
    let { stdout: path } = await execAsync(`which microsoft-edge`);
    // which includes a newline that we should get rid of
    path = path.trim();
    const { stdout: fullVer } = await execAsync(`microsoft-edge --version`);
    const match = fullVer.toString().match(/\d{1,}.\d{1,}.\d{1,}.\d{1,}/g);
    if (match) return { path, version: match[0] };
  } catch (err) {
    process.stdout.write('MS Edge Browser was not found');
  }
};

export const getBrowserData = async (
  edgeBinaryPath?: string | undefined,
): Promise<
  | {
      path: string;
      version: string;
    }
  | undefined
> => {
  if (isWin()) return await getBrowserBinaryOnWin();
  if (process.platform === 'darwin') return await getBrowserBinaryOnMac(edgeBinaryPath);
  if (process.platform === 'linux') return await getBrowserBinaryOnLinux();
};
