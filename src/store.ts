import { observable, action, computed } from 'mobx';
import { promisedComputed } from 'computed-async-mobx';
import { readDirectory, ExtendedFile, readFileAsDataUrl, wait } from './utils';
import { union, sortBy, difference, intersection } from 'lodash';

interface JpegRawPhoto {
  prefix: string,
  jpeg: ExtendedFile | null | undefined,
  raw: ExtendedFile | null | undefined
}

interface PhotoDataUrl {
  prefix: string,
  dataUrl: string
}

const JPEG_DATA_URL_PREFETCH_SIZE = 50;
const JPEG_DATA_URL_PRERENDER_SIZE = 10;

export class Store {

  @observable.ref unsortedJpegDirectory: FileSystemDirectoryHandle | null = null;
  @action setUnsortedJpegDirectory = (newValue: FileSystemDirectoryHandle | null) => {
    this.unsortedJpegDirectory = newValue;
  }

  @observable.ref unsortedRawDirectory: FileSystemDirectoryHandle | null = null;
  @action setUnsortedRawDirectory = (newValue: FileSystemDirectoryHandle | null) => {
    this.unsortedRawDirectory = newValue;
  }

  @observable.ref sortedJpegDirectory: FileSystemDirectoryHandle | null = null;
  @action setSortedJpegDirectory = (newValue: FileSystemDirectoryHandle | null) => {
    this.sortedJpegDirectory = newValue;
  }

  @observable.ref sortedRawDirectory: FileSystemDirectoryHandle | null = null;
  @action setSortedRawDirectory = (newValue: FileSystemDirectoryHandle | null) => {
    this.sortedRawDirectory = newValue;
  }



  unsortedPhotosAsync = promisedComputed([] as JpegRawPhoto[], async () => {
    const {
      unsortedJpegDirectory,
      unsortedRawDirectory
    } = this;
    return await makeJpegRawPhotos(
      unsortedJpegDirectory,
      unsortedRawDirectory
    );
  });

  sortedPhotosAsync = promisedComputed([] as JpegRawPhoto[], async () => {
    const {
      sortedJpegDirectory,
      sortedRawDirectory
    } = this;
    return await makeJpegRawPhotos(
      sortedJpegDirectory,
      sortedRawDirectory
    );
  });


  @observable.ref _selectedPhotoIndex: number | null = null;
  @computed get selectedPhotoIndex() {
    return this._selectedPhotoIndex ?? 0;
  }
  @action setSelectedPhotoIndex = (newValue: number) => {
    this._selectedPhotoIndex = newValue;
  }
  @computed get selectedPhotoPrefix() {
    const { selectedPhotoIndex } = this;
    const unsortedPhotos = this.unsortedPhotosAsync.get();
    return unsortedPhotos[selectedPhotoIndex]?.prefix ?? "";
  }

  selectedPhotoUrlAsync = promisedComputed(null, async () => {
    const { selectedPhotoIndex } = this;
    const unsortedPhotos = this.unsortedPhotosAsync.get();
    const unsortedPhoto = unsortedPhotos[selectedPhotoIndex] ?? null;

    const result = unsortedPhoto?.jpeg ? {
      prefix: unsortedPhoto.prefix,
      dataUrl: await readFileAsDataUrl(unsortedPhoto.jpeg)
    } as PhotoDataUrl : null;

    return result;
  })


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