#!/bin/sh

cd js/src/components
npm install
npm run build

cd ../block
npm install
npm run build

cd ../../..

if [ -d "/tmp/wp-open-events" ]; then
  rm -Rf /tmp/wp-open-events
fi
mkdir -p /tmp/wp-open-events/js

cp -r js/build /tmp/wp-open-events/js
cp -r classes /tmp/wp-open-events
cp -r languages /tmp/wp-open-events
cp wp-open-events.php /tmp/wp-open-events
cp LICENSE /tmp/wp-open-events

cd /tmp/wp-open-events

zip -r wp-open-events.zip *
