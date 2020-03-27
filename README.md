# MSEdgeDriver

An NPM wrapper for Chromium-based [MS Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/).

The module detects Edge browser version, installed on the local system and downloads the driver of the same version.

## Install

```shell
npm install ms-chromium-edge-driver
```

## Usage

```typescript
import { installDriver } from 'ms-chromium-edge-driver';
import { Builder } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge';

const edgePaths = await installDriver();
const edgeOptions = new edge.Options();
edgeOptions.setEdgeChromium(true);
edgeOptions.setBinaryPath(edgePaths.browserPath);
const driver = new Builder()
  .forBrowser('MicrosoftEdge')
  .setEdgeOptions(edgeOptions)
  .setEdgeService(new edge.ServiceBuilder(edgePaths.driverPath))
  .build();
```

## Custom binaries url

To use a mirror of the MSEdgeDriver binaries use PATH variable `EDGE_DRIVER_CDNURL`.
Default is `https://msedgedriver.azureedge.net`.

```shell
EDGE_DRIVER_CDNURL=https://<mirror address> npm install chromedriver
```

## Custom driver binary

To get the msedgedriver from the filesystem instead of a web request use the npm config property `npm_config_edge_driver_path`.

```shell
npm install ms-chromium-edge-driver --npm_config_edge_driver_path=/path/to/msedgedriver.exe
```

Or add property into your [`.npmrc`](https://docs.npmjs.com/files/npmrc) file.

```
npm_config_edge_driver_path=/path/to/msedgedriver.exe
```

Another option is to use the PATH variable `EDGE_DRIVER_PATH`

```shell
EDGE_DRIVER_PATH=/path/to/msedgedriver.exe
```

## License

Licensed under the Apache License, Version 2.0.
