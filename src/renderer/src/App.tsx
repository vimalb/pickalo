import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Store, PRERENDER_WINDOW, SyncState } from './store';

import { useHotkeys } from 'react-hotkeys-hook';

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";
import { apiClient } from './client';
import { AppMenu } from './AppMenu';


import { 
  Button,
} from '@material-ui/core'

console.log(`React version: ${React.version}`);
const App = observer(() => {

  const store = useLocalStore(() => new Store());

  const {
    unsortedJpegDirectory,
    setUnsortedJpegDirectory,
    unsortedRawDirectory,
    setUnsortedRawDirectory,
    sortedJpegDirectory,
    setSortedJpegDirectory,
    sortedRawDirectory,
    setSortedRawDirectory,

    unsortedPhotos,
    refreshUnsortedPhotos,
    sortedPhotos,
    refreshSortedPhotos,
    windowedImages,
    
    
    selectedPhotoIndex,
    setSelectedPhotoIndex,

    photoSync,

    platformInfo
  } = store;

  const currentUnsortedPhoto = unsortedPhotos[selectedPhotoIndex];
  const currentSortedPhoto = currentUnsortedPhoto?.prefix ? sortedPhotos[currentUnsortedPhoto.prefix] : null;

  useHotkeys('space,delete,pageup,pagedown,up,down', async (event,handler) => {
    event.preventDefault();

    if(handler.keys?.includes("space")) {
      if(currentUnsortedPhoto?.jpeg && sortedJpegDirectory && !currentSortedPhoto?.jpeg) {
        await apiClient.copyToDirectory(currentUnsortedPhoto.jpeg.path, sortedJpegDirectory)
        refreshSortedPhotos();
      }
      if(currentUnsortedPhoto?.raw && sortedRawDirectory && !currentSortedPhoto?.raw) {
        await apiClient.copyToDirectory(currentUnsortedPhoto.raw.path, sortedRawDirectory)
        refreshSortedPhotos();
      }
    }

    if(handler.keys?.includes("delete")) {
      if(currentUnsortedPhoto?.prefix && sortedJpegDirectory && currentSortedPhoto?.jpeg) {
        await apiClient.deleteFromDirectory(sortedJpegDirectory, currentUnsortedPhoto.prefix);
        refreshSortedPhotos();
      }
      if(currentUnsortedPhoto?.raw && sortedRawDirectory && currentSortedPhoto?.raw) {
        await apiClient.deleteFromDirectory(sortedRawDirectory, currentUnsortedPhoto.prefix);
        refreshSortedPhotos();
      }
    }

    if(handler.keys?.includes("pageup")) {
      setSelectedPhotoIndex(
        Math.max(selectedPhotoIndex-100, 0)
      )
    }

    if(handler.keys?.includes("pagedown")) {
      setSelectedPhotoIndex(
        Math.max(
          Math.min(selectedPhotoIndex+100, unsortedPhotos.length - 1),
          0
        )
      )
    }

    if(handler.keys?.includes("up")) {
      const target = unsortedPhotos
              .map((up,idx) => ({up,idx}))
              .filter(({up,idx}) => idx < selectedPhotoIndex && sortedPhotos[up.prefix])
              .slice(-1)[0]
      if(target) {
        setSelectedPhotoIndex(target.idx);
      }
    }

    if(handler.keys?.includes("down")) {
      const target = unsortedPhotos
              .map((up,idx) => ({up,idx}))
              .filter(({up,idx}) => idx > selectedPhotoIndex && sortedPhotos[up.prefix])[0]
      if(target) {
        setSelectedPhotoIndex(target.idx);
      }
    }


  }, {}, [selectedPhotoIndex, unsortedPhotos, sortedPhotos])  

  return (
    <Lightbox
      plugins={[Zoom, Captions, Thumbnails]}
      open={true}
      slides={windowedImages}
      index={selectedPhotoIndex}
      on={{
        view: ({index}) => {
          setSelectedPhotoIndex(index)
        }
      }}
      carousel={{
        finite: true,
        preload: PRERENDER_WINDOW
      }}
      animation={{
        fade: 10, swipe: 10
      }}
      zoom={{
        maxZoomPixelRatio: 4
      }}
      toolbar={{
        buttons: [

          <Button
            variant="text"
            onClick={() => {
              refreshUnsortedPhotos();
              refreshSortedPhotos();
            }}
            style={{ height: 40, marginLeft: 40 }}
          >
            <span
              className="fa-solid fa-rotate"
              style={{ 
                color: "white",
                verticalAlign: "middle",
                fontSize: "30px"
              }}
            ></span>
          </Button>,

          <Button 
            variant="contained"
            color={unsortedJpegDirectory ? "primary" : "secondary"}
            style={{ height: 40, marginLeft: 0 }}
            onClick={async () => {
              const dirHandle = await apiClient.chooseDirectory();
              if(dirHandle) {
                setUnsortedJpegDirectory(dirHandle);
              }
            }}
          >JPG</Button>,

          <Button 
            variant="contained"
            color={unsortedRawDirectory ? "primary" : "secondary"}
            style={{ height: 40, marginLeft: 10 }}
            onClick={async () => {
              const dirHandle = await apiClient.chooseDirectory();
              if(dirHandle) {
                setUnsortedRawDirectory(dirHandle);
              }
            }}
          >RAW</Button>,

          <span className="fa-solid fa-caret-right" style={{ 
            color: "white",
            lineHeight: "40px",
            verticalAlign: "middle",
            fontSize: "30px",
            marginLeft: 5
          }}></span>,

          <Button 
            variant="contained"
            color={sortedJpegDirectory ? "primary" : "secondary"}
            style={{ height: 40, marginLeft: 8 }}
            onClick={async () => {
              const dirHandle = await apiClient.chooseDirectory();
              if(dirHandle) {
                setSortedJpegDirectory(dirHandle);
              }
            }}
          >JPG</Button>,

          <Button 
            variant="contained"
            color={sortedRawDirectory ? "primary" : "secondary"}
            style={{ height: 40, marginLeft: 10 }}
            onClick={async () => {
              const dirHandle = await apiClient.chooseDirectory();
              if(dirHandle) {
                setSortedRawDirectory(dirHandle);
              }
            }}
          >RAW</Button>,

          <Button
            variant="text"
            onClick={async () => {
              await Promise.all(photoSync.pending.map(async ({unsorted, sorted}) => {
                if(unsorted.jpeg && sortedJpegDirectory && !sorted.jpeg) {
                  await apiClient.copyToDirectory(unsorted.jpeg.path, sortedJpegDirectory)
                }
                if(unsorted.raw && sortedRawDirectory && !sorted.raw) {
                  await apiClient.copyToDirectory(unsorted.raw.path, sortedRawDirectory)
                }
              }));
              refreshSortedPhotos();
            }}
            style={{ height: 40, marginLeft: 0 }}
            disabled={photoSync.state === SyncState.UNAVAILABLE}
          >
            <span
              className="fa-solid fa-right-left"
              style={{ 
                color: photoSync.state === SyncState.UNAVAILABLE ? "grey" :
                       photoSync.state === SyncState.PENDING ? "yellow" : 
                       "green",
                verticalAlign: "middle",
                fontSize: "25px"
              }}
            ></span>
          </Button>,

          <AppMenu {...{platformInfo}} />
        ]
      }}
    />
  )
})

export default App