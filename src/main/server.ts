import { MainApi, FileDetail, JpegMetaRequest, JpegMeta, JpegSrcSet } from '../common/api';
import { dialog } from 'electron';
import { readdir, cp, rm } from 'fs/promises';
import path from 'path';
import url from 'url';
import { union, sortBy, difference, intersection } from 'lodash';
import sharp from 'sharp';
import ExifReader from 'exifreader';
import { requestInstallWindowsShellExtensions, requestUninstallWindowsShellExtensions } from './shellex';



const getFileList = async (dirName: string): Promise<FileDetail[]> => {
  const items = await readdir(dirName, { withFileTypes: true });
  const contents = (await Promise.all(items.map(async item => {
    const fullItemPath = path.join(dirName, item.name);
    if (item.isDirectory()) {
      return getFileList(fullItemPath);
    } else {
      return [{
        name: item.name,
        path: fullItemPath,
        url: url.pathToFileURL(fullItemPath).toString()
      } as FileDetail];
    }
  }))).flatMap(l => l);

  return contents;
};

const makeJpegMetaRequestCacheKey = (request: JpegMetaRequest) => {
  return `${request.path}`;
}

interface JpegMetaCacheEntry {
  jpegMetaAsync: Promise<JpegMeta>,
  request?: JpegMetaRequest | null | undefined
}
const jpegMetaCache: Record<string,JpegMetaCacheEntry> = {};
interface JpegMetaCacheRequest {
  retainOnly?: string[],
  prefetch?: JpegMetaRequest
}
let jpegMetaCacheQueue: JpegMetaCacheRequest[] = [];
setTimeout(async () => {
  while(true) {
    const request = jpegMetaCacheQueue.shift();
    if(request) {
      if(request.retainOnly) {
        const keysToDelete = difference(Object.keys(jpegMetaCache), request.retainOnly);
        keysToDelete.forEach(key => {
          delete jpegMetaCache[key];
        });
      }
      if(request.prefetch) {
        const key = makeJpegMetaRequestCacheKey(request.prefetch);
        if(jpegMetaCache[key]?.request?.windowHeight !== request.prefetch.windowHeight) {
          const jpegMetaAsync = extractJpegMeta(request.prefetch);
          jpegMetaCache[key] = {
            jpegMetaAsync,
            request: request.prefetch
          };
          await jpegMetaAsync;
        }        
      }      
    } else {
      await new Promise(res => setTimeout(res, 50));
    }
  }
},10);



const extractJpegMeta = async (request: JpegMetaRequest) => {
  const start = new Date().getTime();
  let srcSet: JpegSrcSet[] = [];
  let dimensions: { width: number, height: number } = { width: 0, height: 0 };
  const fullSizeFileUrl = url.pathToFileURL(request.path).toString();

  try {

    const metadata = await sharp(request.path).metadata();
    dimensions = {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0
    }

    srcSet = [
      { src: fullSizeFileUrl, ...dimensions }
    ]

      const halfSize = await sharp(request.path)
        .resize({height: 1080})
        .jpeg({ quality: 50 })
        .withMetadata()
        .toBuffer({ resolveWithObject: true });
      srcSet.push(
        { 
          src: `data:image/jpeg;base64,${halfSize.data.toString('base64')}`,
          width: halfSize.info.width,
          height: halfSize.info.height
        }
      )    

  } catch (err) {
    console.error(`Error resizing ${request.path}`, err);
  }

  const response: JpegMeta = {
    path: request.path,
    src: fullSizeFileUrl,
    srcSet,
    ...dimensions
  }
  const end = new Date().getTime();
  console.log(`Executing jpeg meta request: ${request.path} in ${end - start}ms`);
  return response as JpegMeta;
}

class ApiServer {

  chooseDirectory = async () => (await dialog.showOpenDialog({
    properties: ['openDirectory']
  })).filePaths[0]

  recursiveListDirectory = (dirName: string) => getFileList(dirName)

  copyToDirectory = async (srcFile: string, dstDir: string) => {
    const dstFile = path.join(dstDir, path.basename(srcFile));
    console.log(`Copying ${srcFile} to ${dstFile}`);
    await cp(srcFile, dstFile, {preserveTimestamps: true});
  }

  deleteFromDirectory = async (targetDir: string, filePrefix: string) => {
    const allFiles = await this.recursiveListDirectory(targetDir);
    const normalizedFilePrefix = `${filePrefix.toLowerCase()}.`;
    const filesToDelete = allFiles.filter(f => f.name.toLowerCase().startsWith(normalizedFilePrefix));
    await Promise.all(filesToDelete.map(async f => {
      console.log(`Deleting ${f.path}`);
      await rm(f.path);
    }));
  }

  precacheJpegMeta = async (requests: JpegMetaRequest[]) => {
    jpegMetaCacheQueue = [];
    jpegMetaCacheQueue.push({
      retainOnly: requests.map(r => makeJpegMetaRequestCacheKey(r))
    });
    requests.forEach(r => {
      jpegMetaCacheQueue.push({
        prefetch: r
      });        
    });
  }

  getJpegMeta = async (request: JpegMetaRequest) => {
    const key = makeJpegMetaRequestCacheKey(request);
    let responseCacheEntry = jpegMetaCache[key] ?? null;
    if(!responseCacheEntry) {
      responseCacheEntry = {
        jpegMetaAsync: extractJpegMeta(request),
        request
      }
      jpegMetaCache[key] = responseCacheEntry;
    }
    const response = await responseCacheEntry.jpegMetaAsync;
    return response;
  }

  installShellExtension = async () => {
    await requestInstallWindowsShellExtensions();    
  }

  uninstallShellExtension = async () => {
    await requestUninstallWindowsShellExtensions();
  }

}

export const apiServer: MainApi = new ApiServer();

