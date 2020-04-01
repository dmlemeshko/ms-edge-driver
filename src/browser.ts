import { exec } from 'child_process';
import { promisify } from 'util';
import * as _ from 'lodash';
const execAsync = promisify(exec);
const DEFAULT_EDGE_BINARY_PATH = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const DEFAULT_EDGE_HKEY =
  '\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{56EB18F8-B008-4CBD-B6D2-8C97FE7E9062}';

const getBrowserBinaryOnWin = () => {
  const edgeBinaryHKey = process.env.EDGE_HKEY || DEFAULT_EDGE_HKEY;
  let key;
  let subKey;
  try {
    const Key = require('windows-registry').Key;
    const windef = require('windows-registry').windef;
    key = new Key(windef.HKEY.HKEY_LOCAL_MACHINE, '', windef.KEY_ACCESS.KEY_READ);
    subKey = key.openSubKey(edgeBinaryHKey, windef.KEY_ACCESS.KEY_READ);
    const path = subKey.getValue('location') as string;
    const version = subKey.getValue('pv') as string;
    return { path, version };
  } catch (err) {
    process.stdout.write(`MS Edge browser is not found in registry: ${err.stderr} \n`);
  } finally {
    if (subKey) {
      subKey.close();
    }
    if (key) {
      key.close();
    }
  }
};

const getBrowserBinaryOnMac = async (edgeBinaryPath: string | undefined) => {
  const binaryPath = typeof edgeBinaryPath === 'undefined' ? DEFAULT_EDGE_BINARY_PATH : edgeBinaryPath;
  try {
    const { stdout } = await execAsync(`"${binaryPath}" --version`);
    const found = stdout.toString().match(/\d{1,}.\d{1,}.\d{1,}.\d{1,}/g);
    if (found) {
      return { path: binaryPath, version: found[0] };
    }
  } catch (err) {
    process.stdout.write(`MS Edge browser is not found in Applications: ${err.stderr} \n`);
  }
};

export { getBrowserBinaryOnWin, getBrowserBinaryOnMac };
