import React from 'react'
import { observer, useLocalStore } from 'mobx-react-lite'
import { Store } from './store';

import { useHotkeys } from 'react-hotkeys-hook';


import { 
  Paper,
  Button,
  Typography
} from '@material-ui/core'


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
    
    selectedPhotoIndex,
    setSelectedPhotoIndex,
    selectedPhotoPrefix,
  } = store;

  const unsortedPhotos = store.unsortedPhotosAsync.get();
  const sortedPhotos = store.sortedPhotosAsync.get();
  const selectedPhotoUrl = store.selectedPhotoUrlAsync.get();

  useHotkeys('left,right', (event,handler) => {
    event.preventDefault();
    if(handler.keys?.includes("left")) {
      const newIndex = Math.max(selectedPhotoIndex - 1, 0);
      setSelectedPhotoIndex(newIndex);
    } else if(handler.keys?.includes("right")) {
      const newIndex = Math.min(
        selectedPhotoIndex + 1,
        Math.max(unsortedPhotos.length - 1,0)
      );
      setSelectedPhotoIndex(newIndex);
    }
  }, {}, [selectedPhotoIndex, unsortedPhotos])  

  return (
    <div style={{ marginLeft: 10, marginTop: 20, marginBottom: 20}}>

      <Typography variant="h4" style={{ marginTop: 10 }}>
        QuickPic
      </Typography>

      <div style={{ marginTop: 10 }}>

        <div style={{ display: 'inline-block', marginLeft: 10 }}>
          <Button variant="contained" color={unsortedJpegDirectory ? "primary" : "secondary"} onClick={async () => {
            const dirHandle = await (window as any).showDirectoryPicker();
            setUnsortedJpegDirectory(dirHandle)
          }}>{ unsortedJpegDirectory ? `All JPEGs: ${unsortedJpegDirectory.name}` : "Choose Unsorted JPEGs"}</Button>
        </div>

        <div style={{ display: 'inline-block', marginLeft: 10 }}>
          <Button variant="contained" color={unsortedRawDirectory ? "primary" : "secondary"} onClick={async () => {
            const dirHandle = await (window as any).showDirectoryPicker();
            setUnsortedRawDirectory(dirHandle)
          }}>{ unsortedRawDirectory ? `All RAWs: ${unsortedRawDirectory.name}` : "Choose Unsorted RAWs"}</Button>
        </div>

        <div style={{ display: 'inline-block', marginLeft: 10 }}>
          <Button variant="contained" color={sortedJpegDirectory ? "primary" : "secondary"} onClick={async () => {
            const dirHandle = await (window as any).showDirectoryPicker();
            setSortedJpegDirectory(dirHandle)
          }}>{ sortedJpegDirectory ? `Sorted JPEGs: ${sortedJpegDirectory.name}` : "Choose Sorted JPEGs"}</Button>
        </div>

        <div style={{ display: 'inline-block', marginLeft: 10 }}>
          <Button variant="contained" color={sortedRawDirectory ? "primary" : "secondary"} onClick={async () => {
            const dirHandle = await (window as any).showDirectoryPicker();
            setSortedRawDirectory(dirHandle)
          }}>{ sortedRawDirectory ? `Sorted RAWs: ${sortedRawDirectory.name}` : "Choose Sorted RAWs"}</Button>
        </div>


      </div>

      <div>
        Image:
        <pre>
          { JSON.stringify({
            index: selectedPhotoIndex,
            prefix: selectedPhotoPrefix
          }, null, 2) }
        </pre>
        { selectedPhotoUrl && 
          <img 
            key={selectedPhotoUrl.prefix}
            src={selectedPhotoUrl.dataUrl}
            style={{ 
              width: '100%'
            }}
          />        
        }
      </div>

      <div>
        <pre>
          { JSON.stringify(unsortedPhotos.map(u => ({
            prefix: u.prefix,
            jpeg: u.jpeg ? `${u.jpeg.relativePath}/${u.jpeg.name}` : '',
            raw: u.raw ? `${u.raw.relativePath}/${u.raw.name}` : ''
          })), null, 2) }
        </pre>

        <pre>
          { JSON.stringify(sortedPhotos.map(u => ({
            prefix: u.prefix,
            jpeg: u.jpeg ? `${u.jpeg.relativePath}/${u.jpeg.name}` : '',
            raw: u.raw ? `${u.raw.relativePath}/${u.raw.name}` : ''
          })), null, 2) }
        </pre>

      </div>

    </div>
  )
})

export default App