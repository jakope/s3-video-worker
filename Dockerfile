FROM node:16
WORKDIR /
COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci --only=production && npm cache clean --force
COPY . /

ENV S3_KEY=${S3_KEY}
ENV S3_SECRET=${S3_SECRET}
ENV S3_URL=${S3_URL}
ENV S3_BUCKET=${S3_BUCKET}

CMD node index.js