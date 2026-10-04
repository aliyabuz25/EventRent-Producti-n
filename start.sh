#!/bin/bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 22
cd /Users/ali_new/Desktop/eventrent
exec node node_modules/vite/bin/vite.js --strictPort --port=5050 --host=0.0.0.0