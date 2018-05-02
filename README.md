## SGM-Chrome-Extension-Steam-API-Backend
A small API to protect the Steam API key used in the extension.

### Installation
You'll want to run `yarn` (or `npm i`) to install all dependencies.

Copy config.example.js to config.js and fill in all the blanks.

I recommend installing pm2 (`npm install pm2 -g`) and adding server.js (`pm2 start src/index.js --name steam-backend`). You can use the `pm2 save` and `pm2 startup` commands to ensure it runs at boot.
