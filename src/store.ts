import { observable, action, computed } from 'mobx';
import { promisedComputed } from 'computed-async-mobx';
import { readDirectory, ExtendedFile, readFileAsDataUrl, wait, readFile } from './utils';
import { union, sortBy, difference, intersection } from 'lodash';
import ExifReader from 'exifreader';


interface JpegRawPhoto {
  prefix: string,
  jpeg: ExtendedFile | null | undefined,
  raw: ExtendedFile | null | undefined
}

interface PhotoDataUrl {
  prefix: string,
  dataUrl: string
}

interface LightboxPhoto {
  src: string,
  title?: string,
  description?: string
}

const PRELOAD_WINDOW = 10;


export class Store {

  @observable.ref unsortedJpegDirectory: FileSystemDirectoryHandle | null = null;
  @action setUnsortedJpegDirectory = (newValue: FileSystemDirectoryHandle | null) => {
    this.unsortedJpegDirectory = newValue;
    this._windowedUnsortedPhotosAsync = [];
    this.setSelectedPhotoIndex(0);
  }

  @observable.ref unsortedRawDirectory: FileSystemDirectoryHandle | null = null;
  @action setUnsortedRawDirectory = (newValue: FileSystemDirectoryHandle | null) => {
    this.unsortedRawDirectory = newValue;
    this._windowedUnsortedPhotosAsync = [];
  }

  @observable.ref sortedJpegDirectory: FileSystemDirectoryHandle | null = null;
  @action setSortedJpegDirectory = (newValue: FileSystemDirectoryHandle | null) => {
    this.sortedJpegDirectory = newValue;
  }

  @observable.ref sortedRawDirectory: FileSystemDirectoryHandle | null = null;
  @action setSortedRawDirectory = (newValue: FileSystemDirectoryHandle | null) => {
    this.sortedRawDirectory = newValue;
  }



  _unsortedPhotosAsync = promisedComputed([] as JpegRawPhoto[], async () => {
    const {
      unsortedJpegDirectory,
      unsortedRawDirectory
    } = this;
    return await makeJpegRawPhotos(
      unsortedJpegDirectory,
      unsortedRawDirectory
    );
  });
  @computed get unsortedPhotos() {
    return this._unsortedPhotosAsync.get()
  }

  _sortedPhotosAsync = promisedComputed([] as JpegRawPhoto[], async () => {
    const {
      sortedJpegDirectory,
      sortedRawDirectory
    } = this;
    return await makeJpegRawPhotos(
      sortedJpegDirectory,
      sortedRawDirectory
    );
  });
  @action refreshSortedPhotos = () => {
    this._sortedPhotosAsync.refresh();
  }
  @computed get sortedPhotos() {
    return Object.fromEntries(this._sortedPhotosAsync.get().map(e => [e.prefix, e]));
  }






  @observable.ref _selectedPhotoIndex: number | null = null;
  @computed get selectedPhotoIndex() {
    return this._selectedPhotoIndex ?? 0;
  }
  @action setSelectedPhotoIndex = (newValue: number) => {
    this._selectedPhotoIndex = newValue;
  }

  _windowedUnsortedPhotosAsync = [] as (Promise<LightboxPhoto> | null)[]
  windowedImagesAsync = promisedComputed([] as LightboxPhoto[], async () => {
    const {
      unsortedPhotos,
      selectedPhotoIndex,
      sortedPhotos
    } = this;

    if(this._windowedUnsortedPhotosAsync.length !== unsortedPhotos.length) {
      this._windowedUnsortedPhotosAsync = unsortedPhotos.map(up => null);
    }
    this._windowedUnsortedPhotosAsync = this._windowedUnsortedPhotosAsync.map((item,idx) => (
      (idx < (selectedPhotoIndex - PRELOAD_WINDOW)) ? null :
      (idx < (selectedPhotoIndex + PRELOAD_WINDOW) && item === null && unsortedPhotos[idx].jpeg) ? readFileAsDataUrl(unsortedPhotos[idx].jpeg!!).then(src => {
        return {
          src
        } as LightboxPhoto
      }) :
      (idx < (selectedPhotoIndex + PRELOAD_WINDOW)) ? item : null
    ));
    
    const windowedUnsortedPhotos = (await Promise.all(this._windowedUnsortedPhotosAsync.map(x => x || { src: "" } as LightboxPhoto))).map((up,idx) => {

      const unsortedPhoto = unsortedPhotos[idx];

      const srcFileName = (unsortedPhoto.jpeg && unsortedPhoto.raw) ? `${unsortedPhoto.jpeg?.name}+${unsortedPhoto.raw?.name.split('.').slice(-1)[0]}` :
                          unsortedPhoto.jpeg ? unsortedPhoto.jpeg?.name :
                          unsortedPhoto.raw ? unsortedPhoto.raw?.name :
                          unsortedPhoto.prefix;

      const sortedPhoto = sortedPhotos[unsortedPhoto.prefix];

      const dstFileName = !sortedPhoto ? "" :
                          (sortedPhoto.jpeg && sortedPhoto.raw) ? `\u2764\uFE0F JPG+${sortedPhoto.raw?.name.split('.').slice(-1)[0].toUpperCase()}` :
                          sortedPhoto.jpeg ? `\u2764\uFE0F JPG` :
                          sortedPhoto.raw ? `\u2764\uFE0F ${sortedPhoto.raw?.name.split('.').slice(-1)[0].toUpperCase()}` :
                          sortedPhoto.prefix;
            

      return {
        ...up,
        title: `${srcFileName} ${dstFileName}`
      }

    });
    
    return windowedUnsortedPhotos;
  });
  @computed get windowedImages() {
    return this.windowedImagesAsync.get();
  }





}



const makeJpegRawPhotos = async (
  jpegDirectory: FileSystemDirectoryHandle | null | undefined,
  rawDirectory: FileSystemDirectoryHandle | null | undefined
) => {
  const jpegHandles = jpegDirectory ? (await readDirectory(jpegDirectory)) : [];
  const allJpegHandlesMap: Record<string,File[]> = {};
  jpegHandles.forEach((jh) => {
    const nameParts = jh.name.split(".");
    if(nameParts.length >= 2) {
      const prefix = nameParts.slice(0,-1).join(".").toLowerCase();
      const extension = nameParts.slice(-1)[0].toLowerCase();
      if([
        "jpg",
        "jpeg"
      ].includes(extension)) {
        if(!allJpegHandlesMap[prefix]) {
          allJpegHandlesMap[prefix] = [];
        }
        allJpegHandlesMap[prefix].push(jh);
      }
    }
  });
  
  const rawHandles = rawDirectory ? (await readDirectory(rawDirectory)) : [];
  const allRawHandlesMap: Record<string,File[]> = {};
  rawHandles.forEach((jh) => {
    const nameParts = jh.name.split(".");
    if(nameParts.length >= 2) {
      const prefix = nameParts.slice(0,-1).join(".").toLowerCase();
      const extension = nameParts.slice(-1)[0].toLowerCase();
      if([
        "arw",
        "srf",
        "sr2",
        "crw",
        "cr2",
        "cr3",
        "dng",
        "nef",
        "nrw",
        "orf",
        "pef",
        "ptx",
        "raf",
        "raw",
        "rw2",
        "rwl",
        "srw",
        "x3f"
      ].includes(extension)) {
        if(!allRawHandlesMap[prefix]) {
          allRawHandlesMap[prefix] = [];
        }
        allRawHandlesMap[prefix].push(jh);  
      }
    }
  });

  const jpegPrefixes = Object.keys(allJpegHandlesMap).filter(k => allJpegHandlesMap[k].length === 1);
  const rawPrefixes = Object.keys(allRawHandlesMap).filter(k => allRawHandlesMap[k].length === 1);
  const prefixes = union(jpegPrefixes, rawPrefixes);

  const photos = sortBy(prefixes.map((prefix) => ({
    prefix,
    jpeg: (allJpegHandlesMap[prefix] ?? [])[0],
    raw: (allRawHandlesMap[prefix] ?? [])[0]
  } as JpegRawPhoto)), (uf) => uf.prefix);

  return photos;  
}