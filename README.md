# MSEdgeDriver

An NPM wrapper for Chromium-based [MS Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/).

The module detects Edge browser version, installed on the local system and downloads the driver of the same version.

## Install

```shell
npm install ms-chromium-edge-driver
```

Or download the source and run

```shell
node lib/install.js
```

The package fetches MS Edge browser binary for path and version. Then it downloads the driver of the same version.

The package supports MacOS(darwin) and Windows. Linux based platforms are not supported since there is no MS Edge browser released on it yet.

## Usage

```typescript
import { installDriver } from 'ms-chromium-edge-driver';
import { Builder } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge';

const edgePaths = await installDriver();
const edgeOptions = new edge.Options();
edgeOptions.setEdgeChromium(true);
edgeOptions.setBinaryPath(edgePaths.browserPath);
const driver = await new Builder()
  .forBrowser('MicrosoftEdge')
  .setEdgeOptions(edgeOptions)
  .setEdgeService(new edge.ServiceBuilder(edgePaths.driverPath))
  .build();
```

## Custom binaries url

To use a mirror of the MSEdgeDriver binaries use PATH variable `EDGEDRIVER_CDNURL`.
Default is `https://msedgedriver.azureedge.net`.

```shell
EDGEDRIVER_CDNURL=https://<mirror address> npm install ms-chromium-edge-driver
```

## Custom browser binary path and driver version

To override the default binary path use the npm config property `npm_config_edge_binary_path`.

```shell
npm install ms-chromium-edge-driver --npm_config_edge_binary_path=/path/to/Microsoft Edge
```

Another option is to use the PATH variable `EDGE_BINARY_PATH`

```shell
EDGE_BINARY_PATH=C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe
```

On Windows there is an option to pass custom HKEY by using the PATH variable `EDGE_HKEY`:

```shell
EDGE_HKEY=SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\Current\\Version\\Uninstall\\Microsoft Edge
```

In addition, custom driver version can be specified with the npm config property `npm_config_edgedriver_version`

```shell
npm install ms-chromium-edge-driver --npm_config_edgedriver_version=80.0.361.103
```

Another option is to use the PATH variable `EDGEDRIVER_VERSION`

```shell
EDGEDRIVER_VERSION=80.0.361.103
```

If both browser binary path and version are provided, the package will skip binary fetch step and start with the driver download.

## Custom driver binary

To get the msedgedriver from the filesystem instead of a web request use the npm config property `npm_config_edgedriver_path`.

```shell
npm install ms-chromium-edge-driver --npm_config_edgedriver_path=/path/to/msedgedriver.exe
```

Or add property into your [`.npmrc`](https://docs.npmjs.com/files/npmrc) file.

```
npm_config_edgedriver_path=/path/to/msedgedriver.exe
```

Another option is to use the PATH variable `EDGEDRIVER_PATH`

```shell
EDGEDRIVER_PATH=/path/to/msedgedriver.exe
```

If both the binary path and driver path are provided, the package will return it skipping browser fetching and driver download steps.

## Download driver during npm install

Driver is not downloaded during npm install by default.

To change this behaviour set the npm config property `npm_config_edgedriver_download_on_install`

```shell
npm install ms-chromium-edge-driver --npm_config_edgedriver_download_on_install=1
```

Another option is to use the PATH variable `EDGEDRIVER_DOWNLOAD_ON_INSTALL`

```shell
EDGEDRIVER_DOWNLOAD_ON_INSTALL=1
```

## License

Licensed under the Apache License, Version 2.0.
