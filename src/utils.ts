
export const wait = async (durationMs: number) => {
  await new Promise(res => {
    setTimeout(res, durationMs);
  });
}

export const readFile = (file: File) => {
  return new Promise<ArrayBuffer>((res, rej) => {
    const reader = new FileReader()

    reader.onabort = () => rej('file reading was aborted')
    reader.onerror = () => rej('file reading has failed')
    reader.onload = () => {
      const binaryStr = reader.result as ArrayBuffer
      res(binaryStr)
    }
    reader.readAsArrayBuffer(file);  
  });
}

export const readFileAsDataUrl = (file: File) => {
  return new Promise<string>((res, rej) => {
    console.log(`Begin read: ${file.name}`);
    const reader = new FileReader()

    reader.onabort = () => rej('file reading was aborted')
    reader.onerror = () => rej('file reading has failed')
    reader.onload = () => {
      const dataUrl = reader.result as string
      console.log(`End read: ${file.name}`);
      res(dataUrl)
    }
    reader.readAsDataURL(file);  
  });
}

export interface ExtendedFile extends File {
  relativePath: string
}
async function* getFilesRecursively(entry: any, dirPath: string): any {
  if (entry.kind === "file") {
    const file = await entry.getFile() as ExtendedFile;
    if (file !== null) {
      file.relativePath = dirPath;
      yield file;
    }
  } else if (entry.kind === "directory") {
    const newDirPath = dirPath ? `${dirPath}/${entry.name}` : entry.name;
    for await (const handle of entry.values()) {
      yield* getFilesRecursively(handle, newDirPath);
    }
  }
}
export const readDirectory = async (directoryHandle: FileSystemDirectoryHandle) => {
  const fileHandles: ExtendedFile[] = [];
  for await (const fileHandle of getFilesRecursively(directoryHandle, "")) {
    if(fileHandle.name) {
      fileHandles.push(fileHandle);
    }
  }
  return fileHandles;
}

