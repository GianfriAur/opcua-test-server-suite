FROM node:20-alpine

RUN apk add --no-cache openssl bash

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/

RUN chmod +x scripts/*.sh

EXPOSE 4840

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "const net = require('net'); const s = net.createConnection({port: process.env.OPCUA_PORT || 4840}, () => { s.end(); process.exit(0); }); s.on('error', () => process.exit(1));"

CMD ["node", "src/index.js"]
