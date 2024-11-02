#!/bin/sh

cd js/src/components
npm install
npm run build

cd ../block
npm install
npm run build

cd ../../..

if [ -d "/tmp/regi-fair" ]; then
  rm -Rf /tmp/regi-fair
fi
mkdir -p /tmp/regi-fair/js

cp -r js/build /tmp/regi-fair/js
cp -r classes /tmp/regi-fair
cp -r languages /tmp/regi-fair
cp regi-fair.php /tmp/regi-fair
cp LICENSE /tmp/regi-fair

cd /tmp/regi-fair

zip -r regi-fair.zip *
