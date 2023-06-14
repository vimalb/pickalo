import { CLISwitches } from "./cli";
import { elevate } from 'node-windows';
import { execSync } from 'child_process';

export const escapeShellArg = (s: string) => `"${s.replaceAll('"','""')}"`
export const currentDir = process.cwd();

const currentProcessWithoutSwitches = process.argv
  .filter(s => !s.startsWith("--"))
  .map(s => s === "." ? currentDir : s);
const currentProcessWithoutSwitchesString = currentProcessWithoutSwitches.map(s => escapeShellArg(s)).join(' ');


export const requestInstallWindowsShellExtensions = async () => {
  console.log("Requesting install shell extension")
  await new Promise(res => {
    elevate(
      `${currentProcessWithoutSwitchesString} --${CLISwitches.INSTALL_WINDOWS_SHELL_EX}`,
      {},
      () => res(null)
    )
  })
}

const PARENT_PREFIX = `HKCU\\Software\\Classes\\directory\\shell`;
const DIRECTORY_PREFIX = `${PARENT_PREFIX}\\QuickPicMenu`;
const SUBCOMMAND_PREFIX = `${DIRECTORY_PREFIX}\\Shell`

const directorySwitches = [
  {
    switch: CLISwitches.UNSORTED_JPG,
    name: "Unsorted JPG"
  },
  {
    switch: CLISwitches.UNSORTED_RAW,
    name: "Unsorted RAW"
  },
  {
    switch: CLISwitches.SORTED_JPG,
    name: "Sorted JPG"
  },
  {
    switch: CLISwitches.SORTED_RAW,
    name: "Sorted RAW"
  }
].map((ds, idx) => ({...ds, cmdkey: `${idx}_${ds.switch}`}));

export const processInstallWindowsShellExtensions = async () => {
  console.log("Installing windows shell extension");
  execSync(`reg add "${DIRECTORY_PREFIX}" /v "MUIVerb" /t REG_SZ /d "QuickPic Set As" /f`);
  execSync(`reg add "${DIRECTORY_PREFIX}" /v "SubCommands" /t REG_SZ /d "" /f`);
  directorySwitches.forEach(ds => {
    execSync(`reg add "${SUBCOMMAND_PREFIX}\\${ds.cmdkey}" /ve /t REG_SZ /d ${escapeShellArg(ds.name)} /f`);
    const installSwitchCmd = `reg add "${SUBCOMMAND_PREFIX}\\${ds.cmdkey}\\command" /ve /t REG_SZ /d "${`${currentProcessWithoutSwitchesString} --${ds.switch}="%1"`.replaceAll('"','\\"')}" /f`;
    console.log(installSwitchCmd);
    execSync(installSwitchCmd);
  })
}

export const requestUninstallWindowsShellExtensions = async () => {
  console.log("Requesting uninstall shell extension");
  await new Promise(res => {
    elevate(
      `${currentProcessWithoutSwitchesString} --${CLISwitches.UNINSTALL_WINDOWS_SHELL_EX}`,
      {},
      () => res(null)
    )
  })
}

export const processUninstallWindowsShellExtensions = async () => {
  console.log("Uninstalling windows shell extension");
  try {
    execSync(`reg delete "${DIRECTORY_PREFIX}" /f`);
  } catch {
    console.log("Could not uninstall existing shell extension")
  }
}


