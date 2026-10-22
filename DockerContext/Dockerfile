FROM node:20-slim AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /build/dist /usr/share/nginx/html
COPY DockerContext/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENV JEJUNE_DOCS_SERVER_URL="" \
    JEJUNE_MARKDOWN_TRIGGER_URL="" \
    JEJUNE_MARKDOWN_BROWSER_URL="" \
    JEJUNE_OXIGRAPH_URL=""
ENTRYPOINT ["/docker-entrypoint.sh"]
