import * as dotenv from 'dotenv'
dotenv.config()
import { S3Client } from "@aws-sdk/client-s3";
const Bucket = process.env.S3_BUCKET;
// import { Worker,Queue } from 'bullmq';

export const config = {
    correctClockSkew: true,
    "credentials": {
      "accessKeyId": process.env.S3_KEY,
      "secretAccessKey":  process.env.S3_SECRET,
    },
    "region" : "de",
    "endpoint": process.env.S3_URL,
    "sslEnabled": true,
    "forcePathStyle": true
};
const client = new S3Client(config);
export default client;