import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Store } from './store';

import { readDirectory } from './utils';

import { useHotkeys } from 'react-hotkeys-hook';

import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";



import { 
  Paper,
  Button,
  Typography
} from '@material-ui/core'
import { readFile } from './utils';


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
    sortedPhotos,
    refreshSortedPhotos,
    windowedImages,
    
    
    selectedPhotoIndex,
    setSelectedPhotoIndex
  } = store;

  const currentUnsortedPhoto = unsortedPhotos[selectedPhotoIndex];
  const currentSortedPhoto = currentUnsortedPhoto?.prefix ? sortedPhotos[currentUnsortedPhoto.prefix] : null;

  useHotkeys('space,delete', async (event,handler) => {
    event.preventDefault();

    if(handler.keys?.includes("space")) {
      if(currentUnsortedPhoto?.jpeg && sortedJpegDirectory && !currentSortedPhoto?.jpeg) {
        console.log(`Copying ${currentUnsortedPhoto.jpeg.relativePath}/${currentUnsortedPhoto.jpeg.name} to ${sortedJpegDirectory.name}/${currentUnsortedPhoto.jpeg.name}`);
        const dstFile = await sortedJpegDirectory.getFileHandle(currentUnsortedPhoto.jpeg.name, {create: true});
        const dstWriteFile = await (dstFile as any).createWritable();
        await dstWriteFile.write(await readFile(currentUnsortedPhoto.jpeg));
        await dstWriteFile.close();
        refreshSortedPhotos();
      }
      if(currentUnsortedPhoto?.raw && sortedRawDirectory && !currentSortedPhoto?.raw) {
        console.log(`Copying ${currentUnsortedPhoto.raw.relativePath}/${currentUnsortedPhoto.raw.name} to ${sortedRawDirectory.name}/${currentUnsortedPhoto.raw.name}`);
        const dstFile = await sortedRawDirectory.getFileHandle(currentUnsortedPhoto.raw.name, {create: true});
        const dstWriteFile = await (dstFile as any).createWritable();
        await dstWriteFile.write(await readFile(currentUnsortedPhoto.raw));
        await dstWriteFile.close();
        refreshSortedPhotos();
      }
    }

    if(handler.keys?.includes("delete")) {
      if(currentUnsortedPhoto?.prefix && sortedJpegDirectory && currentSortedPhoto?.jpeg) {
        console.log(`Deleting ${sortedJpegDirectory.name}/${currentUnsortedPhoto.prefix}.*`);
        const entries = (await readDirectory(sortedJpegDirectory)).filter(f => f.name.toLowerCase().startsWith(currentUnsortedPhoto.prefix.toLowerCase()));
        await Promise.all(entries.map(async (entry) => sortedJpegDirectory.removeEntry(entry.name)));
        refreshSortedPhotos();
      }
      if(currentUnsortedPhoto?.raw && sortedRawDirectory && currentSortedPhoto?.raw) {
        console.log(`Deleting ${sortedRawDirectory.name}/${currentUnsortedPhoto.prefix}.*`);
        const entries = (await readDirectory(sortedRawDirectory)).filter(f => f.name.toLowerCase().startsWith(currentUnsortedPhoto.prefix.toLowerCase()));
        await Promise.all(entries.map(async (entry) => sortedRawDirectory.removeEntry(entry.name)));
        refreshSortedPhotos();
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
        preload: 4
      }}
      zoom={{
        maxZoomPixelRatio: 4
      }}
      toolbar={{
        buttons: [
          <Button 
            variant="contained"
            color={unsortedJpegDirectory ? "primary" : "secondary"}
            style={{ height: 40 }}
            onClick={async () => {
              const dirHandle = await (window as any).showDirectoryPicker();
              setUnsortedJpegDirectory(dirHandle)
            }}
          >JPG</Button>,

          <Button 
            variant="contained"
            color={unsortedRawDirectory ? "primary" : "secondary"}
            style={{ height: 40, marginLeft: 10 }}
            onClick={async () => {
              const dirHandle = await (window as any).showDirectoryPicker();
              setUnsortedRawDirectory(dirHandle)
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
              const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
              setSortedJpegDirectory(dirHandle)
            }}
          >JPG</Button>,

          <Button 
            variant="contained"
            color={sortedRawDirectory ? "primary" : "secondary"}
            style={{ height: 40, marginLeft: 10 }}
            onClick={async () => {
              const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
              setSortedRawDirectory(dirHandle)
            }}
          >RAW</Button>
        ]
      }}
    />
  )
})

export default App