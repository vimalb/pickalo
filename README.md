# Pickalo Photo Browser

Pickalo is a basic desktop photo browsing and organizing application for Windows. 

## Installation

Download the latest release [here](https://github.com/vimalb/pickalo/releases). 

## Usage Guide

#### Browse JPEG Photos

Launch the application, then click on the left "JPG" menu button to select a directory of JPEG images to browse. 

You can navigate images with the following keyboard shortcuts:
  * Left Arrow - Back one image
  * Right Arrow - Forward one image
  * Page Up - Back 100 images
  * Page Down - Forward 100 images

#### Sort JPEG Photos

Pickalo sorts JPEG photos using two directories - an "Unsorted" directory and a "Sorted" directory.
  * "Unsorted" directory should contain all of your original JPEG images.
  * "Sorted" directory may either be empty or contain existing images.

While you using Pickalo to browse the "Unsorted" directory, you can quickly choose images to copy to (or remove from) the "Sorted" directory. 

Step by step guide:

  1. Click on the left "JPG" button to choose your "Unsorted" directory
  2. Click on the right "JPG" button to choose your "Sorted" directory
  3. As you are browsing through images in the "Unsorted" directory, press "Space" to copy the current image into the "Sorted" directory.
  4. If the current image is already in the "Sorted" directory, a ❤️ will appear next to the filename in the top bar. 
  5. To remove the current file from the "Sorted" directory, press "Delete"

Additional keyboard shortcuts available when sorting photos:
  * Space - Include current image in "Sorted" directory
  * Delete - Remove current image from "Sorted" directory
  * Up Arrow - Skip to previous image in the "Sorted" directory
  * Down Arrow - Skip to next image in the "Sorted" directory

  
#### Sort JPEG + RAW Photos

Pickalo is particularly useful for quickly browsing and sorting through folders containing matched pairs of JPEG and RAW photos. This use case requires selecting four directories:
  * "Unsorted JPG" directory should contain all of your original JPEG images.
  * "Unsorted RAW" directory should contain all of your original RAW images
      * This can be the same as the "Unsorted JPG" directory if your camera saves JPEG and RAW images together, or it can be a different folder if your camera saves JPEG and RAW images to different cards
      * Files in the "Unsorted RAW" directory should have the same name as files in the "Unsorted JPG" directory and differ only in extension
  * "Sorted JPG" directory may be empty or contain existing JPEG images
  * "Sorted RAW" directory may be empty or contain existing RAW images
      * This can be the same as the "Sorted JPG" directory if you wish to keep your JPEG and RAW images in the same folder, or it can be a different folder if you would like them to be separate

While you using Pickalo to browse the "Unsorted JPG" directory, you can quickly choose images to copy to (or remove from) the "Sorted" directories.

Step by step guide:

  1. Click on the left "JPG" button to choose your "Unsorted JPG" directory
  2. Click on the left "RAW" button to choose your "Unsorted RAW" directory
  3. Click on the right "JPG" button to choose your "Sorted JPG" directory
  4. Click on the right "RAW" button to choose your "Sorted RAW" directory
  5. As you are browsing through images in the "Unsorted JPG" directory, press "Space" to copy the current image into the "Sorted" directories.
      * The JPEG version of the current image will be copied from the "Unsorted JPG" directory to the "Sorted JPG" directory
      * If a RAW version of the current image is present in the "Unsorted RAW" directory, it will also be copied to the "Sorted RAW" directory
  6. If the current image is already in the "Sorted JPG" directory, a ❤️ will appear next to the filename in the top bar. 
  7. To remove the current file from the "Sorted JPG" and "Sorted RAW" directory, press "Delete"

Additional keyboard shortcuts available when sorting photos:
  * Space - Include current image in "Sorted JPG" and "Sorted RAW" directories
  * Delete - Remove current image from "Sorted JPG" and "Sorted RAW" directories
  * Up Arrow - Skip to previous image in the "Sorted JPG" directory
  * Down Arrow - Skip to next image in the "Sorted JPG" directory

If you have JPEG files in the "Sorted JPG" directory but do not have corresponding RAW files in the "Sorted RAW" directory or vice versa, press the ⇄ button to copy missing files from the respective "Unsorted" directories. 



