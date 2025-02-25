# build
FROM node:22-slim as build

WORKDIR /src
COPY tsconfig.json /src/tsconfig.json
COPY package.json /src/package.json
COPY package-lock.* /src/
RUN npm i --production
COPY . /src
RUN npm run build

# runtime
FROM node:22-slim
RUN apt-get update && apt-get install -y \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /src /app
CMD ["node", "dist/main.js", "start"]