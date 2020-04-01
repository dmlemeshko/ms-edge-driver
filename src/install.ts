import { installDriver } from '.';
import * as Fs from 'fs';

const edgePathFile = 'paths.json';
const edgeDriverPath =
  process.env.npm_config_edgedriver_download_on_install || process.env.EDGEDRIVER_DOWNLOAD_ON_INSTALL;

if (edgeDriverPath) {
  installDriver().then(paths => {
    process.stdout.write(`MS Edge driver is set: ${JSON.stringify(paths)}\n`);
    Fs.writeFile(edgePathFile, JSON.stringify(paths), function(err: any) {
      if (err) return process.stdout.write(`${err}\n`);
    });
  });
}
