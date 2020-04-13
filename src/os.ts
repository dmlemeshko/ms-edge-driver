enum OS {
  WIN32 = 'win32',
  WIN64 = 'win64',
  MAC32 = 'mac32',
  MAC64 = 'mac64',
  LINUX = 'linux',
}

const getOS = (): OS => {
  const platform: string = process.platform;
  const arch: string = process.arch;
  if (platform === 'win32') {
    return arch === 'x64' ? OS.WIN64 : OS.WIN32;
  } else if (platform === 'darwin') {
    return arch === 'x64' ? OS.MAC64 : OS.MAC32;
  } else {
    return OS.LINUX;
  }
};

const isWin = (): boolean => {
  return [OS.WIN32, OS.WIN64].includes(getOS());
};

const isSupportedPlatform = (): boolean => {
  return [OS.WIN32, OS.WIN64, OS.MAC64].includes(getOS());
};

export { getOS, isSupportedPlatform, isWin };
