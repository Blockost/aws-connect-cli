#!/bin/bash

echo "This file is intended to be run while inside project directory"
echo "Compiling app to executable..."

npm run tsc && npm run pkg -- out/app.js -c package.json

echo "App successfully compiled !"
exit 0