import { observable, action, computed, reaction } from 'mobx';
import { promisedComputed } from 'computed-async-mobx';
import { wait } from './utils';
import { union, sortBy, difference, intersection, range } from 'lodash';
import { apiClient } from './client';
import { FileDetail, JpegMeta } from '../../common/api';



interface JpegRawPhoto {
  prefix: string,
  jpeg: FileDetail | null | undefined,
  raw: FileDetail | null | undefined
}

interface LightboxPhoto extends JpegMeta {
  title?: string,
  description?: string
}

type LightboxPhotosFragment = Record<string,LightboxPhoto>

export const PREFETCH_WINDOW = 50;
export const PRELOAD_WINDOW = 20;
export const PRERENDER_WINDOW = 4;

const getCurrentWindowHeight = () => {
  return Math.ceil(window.innerHeight / 100) * 100;
}

export enum SyncState {
  UNAVAILABLE,
  SYNCED,
  PENDING
}

export class Store {

  @observable.ref unsortedJpegDirectory: string | null = null;
  @action setUnsortedJpegDirectory = (newValue: string | null) => {
    this.unsortedJpegDirectory = newValue;
    this.setSelectedPhotoIndex(0);
  }

  @observable.ref unsortedRawDirectory: string | null = null;
  @action setUnsortedRawDirectory = (newValue: string | null) => {
    this.unsortedRawDirectory = newValue;
    this.setSelectedPhotoIndex(0);
  }

  @observable.ref sortedJpegDirectory: string | null = null;
  @action setSortedJpegDirectory = (newValue: string | null) => {
    this.sortedJpegDirectory = newValue;
  }

  @observable.ref sortedRawDirectory: string | null = null;
  @action setSortedRawDirectory = (newValue: string | null) => {
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
  @action refreshUnsortedPhotos = () => {
    this._unsortedPhotosAsync.refresh();
    this.setSelectedPhotoIndex(0);
  }
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

  @observable.ref availableLightboxPhotosFragment: LightboxPhotosFragment | null = null
  @action setAvailableLightboxPhotosFragment = (newValue: LightboxPhotosFragment) => {
    this.availableLightboxPhotosFragment = newValue;
  }

  
  _fullWindowedImagesAsync = promisedComputed([] as LightboxPhoto[], async () => {
    const {
      unsortedPhotos,
      selectedPhotoIndex,
      sortedPhotos,
      availableLightboxPhotosFragment
    } = this;


    const windowedImages = (await Promise.all(unsortedPhotos.map(async (unsortedPhoto,idx) => {

      const lightboxPhoto: LightboxPhoto = 
        (availableLightboxPhotosFragment ?? {})[unsortedPhoto.prefix] ? (availableLightboxPhotosFragment ?? {})[unsortedPhoto.prefix] :
        (selectedPhotoIndex === idx && unsortedPhoto?.jpeg) ? (await apiClient.getJpegMeta({ path: unsortedPhoto.jpeg.path, windowHeight: getCurrentWindowHeight() })) :
        {
          src: ""
        };

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
        ...lightboxPhoto,
        title: `${srcFileName} ${dstFileName}`
      }

    })));
   
    return windowedImages;
  });
  @computed get windowedImages() {
    return this._fullWindowedImagesAsync.get();
  }


  @computed get photoSync() {
    const {
      unsortedPhotos,
      sortedPhotos,
      unsortedJpegDirectory,
      unsortedRawDirectory,
      sortedJpegDirectory,
      sortedRawDirectory
    } = this;

    const pending: { unsorted: JpegRawPhoto, sorted: JpegRawPhoto}[] = [];
    let state = SyncState.UNAVAILABLE;

    if(unsortedJpegDirectory && unsortedRawDirectory && sortedJpegDirectory && sortedRawDirectory) {
      const unsortedPhotosMap = Object.fromEntries(unsortedPhotos.map(up => [up.prefix, up]));
        
      Object.values(sortedPhotos).forEach((sorted) => {
        const unsorted = unsortedPhotosMap[sorted.prefix];
        if(unsorted && 
           ((unsorted.jpeg && !sorted.jpeg)
            || (unsorted.raw && !sorted.raw))
        ) {
          pending.push({ unsorted, sorted });
        }
      });

      state = pending.length === 0 ? SyncState.SYNCED : SyncState.PENDING;
    }


    return { state, pending };
  }

  constructor() {

    reaction(() => ({ 
      selectedPhotoIndex: this.selectedPhotoIndex,
      unsortedPhotos: this.unsortedPhotos
    }), async ({selectedPhotoIndex, unsortedPhotos}) =>{

      const checkGate = () => this._selectedPhotoIndex === selectedPhotoIndex;

      const makeArgs = (offsets: number[]) => offsets.map(i => i + selectedPhotoIndex).filter(i =>
        unsortedPhotos.length > 0
        && i >= 0
        && i < unsortedPhotos.length
        && unsortedPhotos[i]?.jpeg?.path
      ).map(i => ({
        prefix: unsortedPhotos[i].prefix!!,
        path: unsortedPhotos[i].jpeg!!.path,
        windowHeight: getCurrentWindowHeight()
      }));

      const availableLightboxPhotosFragment: LightboxPhotosFragment = {
        ...(this.availableLightboxPhotosFragment ?? {})
      };
      const windowedArgs = makeArgs([
        0,
        ...[
          ...range(1,PRERENDER_WINDOW),
          ...range(PRERENDER_WINDOW,PRELOAD_WINDOW)
        ].flatMap(i => [i,-1*i])
      ]);

      difference(
        Object.keys(availableLightboxPhotosFragment),
        windowedArgs.map(r => r.prefix)
      ).forEach((prefix) => {
        delete availableLightboxPhotosFragment[prefix];
      });

      const startUpdateTimestamp = new Date().getTime();
      for(const r of windowedArgs) {
        if(checkGate()) {
          availableLightboxPhotosFragment[r.prefix] = await apiClient.getJpegMeta(r);
          if((new Date().getTime() - startUpdateTimestamp) >= 500) {
            this.setAvailableLightboxPhotosFragment({...availableLightboxPhotosFragment});
          }  
        }
      }
      if(checkGate()) {
        this.setAvailableLightboxPhotosFragment({...availableLightboxPhotosFragment});
      }

      if(checkGate()) {
        apiClient.precacheJpegMeta(
          makeArgs([
            0,
            ...[...range(1,PRERENDER_WINDOW),
            ...range(PRERENDER_WINDOW,PRELOAD_WINDOW),
            ...range(PRELOAD_WINDOW,PREFETCH_WINDOW)].flatMap(i => [i,-1*i])
          ])
        );  
      }
    })
  }

}



const makeJpegRawPhotos = async (
  jpegDirectory: string | null | undefined,
  rawDirectory: string | null | undefined
) => {
  const jpegHandles = jpegDirectory ? (await apiClient.recursiveListDirectory(jpegDirectory)) : [];
  const allJpegHandlesMap: Record<string,FileDetail[]> = {};
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
  
  const rawHandles = rawDirectory ? (await apiClient.recursiveListDirectory(rawDirectory)) : [];
  const allRawHandlesMap: Record<string,FileDetail[]> = {};
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