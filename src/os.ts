enum OS {
  WIN32 = 'win32',
  WIN64 = 'win64',
  MAC64 = 'mac64',
  MAC_ARM64 = 'mac64',
  LINUX = 'linux',
  UNSUPPORTED = 'unsupported',
}

const getOS = (): OS => {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === 'win32') {
    return arch === 'x64' ? OS.WIN64 : OS.WIN32;
  }
  if (platform === 'darwin') {
    if (arch === 'x64') return OS.MAC64;
    if (arch === 'arm64') return OS.MAC_ARM64;
    return OS.UNSUPPORTED;
  }
  return OS.LINUX;
};

const isWin = (): boolean => {
  return [OS.WIN32, OS.WIN64].includes(getOS());
};

const isSupportedPlatform = (): boolean => {
  return [OS.WIN32, OS.WIN64, OS.MAC64, OS.MAC_ARM64].includes(getOS());
};

export { getOS, isSupportedPlatform, isWin };
