import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import * as _ from 'lodash';
import { isWin } from './os';
const execAsync = promisify(exec);
const DEFAULT_EDGE_BINARY_PATH = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const DEFAULT_EDGE_HKEY =
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{56EB18F8-B008-4CBD-B6D2-8C97FE7E9062}';

const getRegistryKey = async (key: string) => {
  return new Promise((resolve, reject) => {
    const regedit = require('regedit');
    regedit.list(key, function(err: any, result: any) {
      if (err){
        return reject(err);
      } else {
        resolve(result[key]);
      }
  })
})
}

const getBrowserBinaryOnWin = async () => {
  const fileName = 'msedge.exe';
  const edgeBinaryHKey = process.env.EDGE_HKEY || DEFAULT_EDGE_HKEY;
  try {
    // const Key = require('windows-registry').Key;
    // const windef = require('windows-registry').windef;
    // key = new Key(windef.HKEY.HKEY_LOCAL_MACHINE, '', windef.KEY_ACCESS.KEY_READ);
    // subKey = key.openSubKey(edgeBinaryHKey, windef.KEY_ACCESS.KEY_READ);
    // const path = subKey.getValue('location') as string;
    // const version = subKey.getValue('pv') as string;
    const key = await getRegistryKey(edgeBinaryHKey);
    //@ts-ignore
    const path = key.values.location;
    //@ts-ignore
    const version = key.values.pv;
    return { path: join(path, fileName), version };
  } catch (err) {
    process.stdout.write(`MS Edge browser is not found in registry: ${err.stderr} \n`);
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
  } catch (err) {
    process.stdout.write(`MS Edge browser is not found in Applications: ${err.stderr} \n`);
  }
};

export const getBrowserData = async (edgeBinaryPath?: string | undefined) => {
  return isWin() ? await getBrowserBinaryOnWin() : await getBrowserBinaryOnMac(edgeBinaryPath);
};
