import { CLISwitches } from "./cli";



export const requestInstallWindowsShellExtensions = async () => {
  console.log("Requesting install shell extension")
  /*
  await sudoer.spawn(
    process.argv[0],
    [...process.argv.slice(1), `--${CLISwitches.INSTALL_WINDOWS_SHELL_EX}`]
  );
  */
}

export const processInstallWindowsShellExtensions = () => {
  console.log("Installing windows shell extension")
}

export const requestUninstallWindowsShellExtensions = async () => {
  console.log("Requesting uninstall shell extension")
  /*
  await sudoer.spawn(
    process.argv[0],
    [...process.argv.slice(1), `--${CLISwitches.UNINSTALL_WINDOWS_SHELL_EX}`]
  );
  */
}

export const processUninstallWindowsShellExtensions = () => {
  console.log("Uninstalling windows shell extension")
}


