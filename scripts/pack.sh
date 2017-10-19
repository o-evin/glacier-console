#!/bin/bash

set -o errexit

echo 'Building...'
NODE_ENV=production ENVIRONMENT=production npm run build
echo 'Packaging...'
electron-packager . --ignore="source|scripts|configs|node_modules" --overwrite --platform=darwin --arch=x64 --icon=source/main/assets/icons/mac/app.icns --prune=true --out=bin
electron-packager . --ignore="source|scripts|configs|node_modules" --overwrite --asar --platform=win32 --arch=x64 --icon=source/main/assets/icons/win/icon.ico --prune=true --out=bin --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="AWS Glacier Console"
electron-packager . --ignore="source|scripts|configs|node_modules" --overwrite --platform=linux --arch=x64 --icon=source/main/assets/icons/png/1024x1024.png --prune=true --out=bin
echo -e 'Packaging success.\n'
echo 'Compressing...'
for i in bin/*/; do zip -rq "${i%/}.zip" "$i"; done
echo -e 'Compressing success.\n'
echo 'Build done.'
