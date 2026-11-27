FROM node:24-bookworm-slim
WORKDIR /app
COPY server ./server
RUN mkdir /data && chown node:node /data
USER node
ENV REDION_DATA_DIR=/data PORT=8790 REDION_BIND=0.0.0.0
EXPOSE 8790
CMD ["node","server/home-server.ts","serve"]
