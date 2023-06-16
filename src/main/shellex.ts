import { CLISwitches } from "./cli";
import { elevate } from 'node-windows';
import { execSync, exec } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';

export const escapeShellArg = (s: string) => `"${s.replaceAll('"','""')}"`
export const currentDir = process.cwd();

console.log(`App path: ${app.getAppPath()}`);
const devAppRoot = app.getAppPath();
const deployAppRoot = devAppRoot.replace("app.asar", "app.asar.unpacked")


const localElevate = (cmd: string, callback: any) => {
  const nodeElevateRelativePath = 'node_modules\\node-windows\\bin\\elevate\\elevate.cmd';
  const deployNodeElevate = join(deployAppRoot, nodeElevateRelativePath);
  const devNodeElevate = join(devAppRoot, nodeElevateRelativePath);
  if(existsSync(deployNodeElevate)) {
    console.log(`Elevating ${cmd} using deployNodeElevate:${deployNodeElevate}`)
    exec(`"${deployNodeElevate}" ${cmd}`, callback);
  } else if(existsSync(devNodeElevate)) {
    console.log(`Elevating ${cmd} using devNodeElevate:${devNodeElevate}`)
    exec(`"${devNodeElevate}" ${cmd}`, callback);
  } else {
    console.log(`Elevating ${cmd} using node-windows.elevate`)
    elevate(cmd, {}, callback);
  }
}

const currentProcessWithoutSwitches = process.argv
  .filter(s => !s.startsWith("--"))
  .map(s => s === "." ? currentDir : s);
const currentProcessWithoutSwitchesString = currentProcessWithoutSwitches.map(s => escapeShellArg(s)).join(' ');


export const requestInstallWindowsShellExtensions = async () => {
  const elevateCommand = `${currentProcessWithoutSwitchesString} --${CLISwitches.INSTALL_WINDOWS_SHELL_EX}`;
  console.log(`Requesting install shell extension: ${elevateCommand}`)
  await new Promise(res => {
    localElevate(
      elevateCommand,
      (err: any) => {
        if(err) {
          console.log(err)
        };
        res(null);
      }
    )
  })
}

const PARENT_PREFIX = `HKCU\\Software\\Classes\\directory\\shell`;
const DIRECTORY_PREFIX = `${PARENT_PREFIX}\\PickaloMenu`;
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
  execSync(`reg add "${DIRECTORY_PREFIX}" /v "MUIVerb" /t REG_SZ /d "Open with Pickalo as" /f`);
  execSync(`reg add "${DIRECTORY_PREFIX}" /v "Icon" /t REG_SZ /d "${process.argv[0]}" /f`);
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
    localElevate(
      `${currentProcessWithoutSwitchesString} --${CLISwitches.UNINSTALL_WINDOWS_SHELL_EX}`,
      (err: any) => {
        if(err) {
          console.log(err)
        };
        res(null);
      }
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


