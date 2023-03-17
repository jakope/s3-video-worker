/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { fileURLToPath } from "url";
import fs from 'fs';

// snippet-start:[javascript.v3.s3.scenarios.multipartdownload]
import s3Client from "../config/s3-client.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
const tenMB = 10 * 1024 * 1024;

export const getObjectRange = ({ bucket, key, start, end }) => {
  const command = new GetObjectCommand({
    Bucket : "athlyzertv",
    Key: key,
    Range: `bytes=${start}-${end}`,
  });

  return s3Client.send(command);
};

export const getRangeAndLength = (contentRange) => {
  const [range, length] = contentRange.split("/");
  const [start, end] = range.split("-");
  return {
    start: parseInt(start),
    end: parseInt(end),
    length: parseInt(length),
  };
};

export const isComplete = ({ end, length }) => end === length - 1;

// When downloading a large file, you might want to break it down into
// smaller pieces. Amazon S3 accepts a Range header to specify the start
// and end of the byte range to be downloaded.
const downloadInChunks = async ({ bucket, key, size }) => {
  const dir = `./${key}`.split("/").slice(0, -1).join("/");
  
  if (!fs.existsSync(`./${key}`)){
    fs.mkdirSync(dir, { recursive: true });
}

  const writeStream = createWriteStream(
    fileURLToPath(new URL(`./${key}`, import.meta.url))
  ).on("error", (err) => console.error(err));

  let rangeAndLength = { start: -1, end: -1, length: -1 };

  while (!isComplete(rangeAndLength)) {
    const { end } = rangeAndLength;
    const nextRange = { start: end + 1, end: end + tenMB };
    const { ContentRange, Body } = await getObjectRange({
      bucket,
      key,
      ...nextRange,
    });

    writeStream.write(await Body.transformToByteArray());
    const p = Math.floor((end / size) * 100);
    console.log(`+++ download ${bucket} - ${key} progress ${p}`)
    rangeAndLength = getRangeAndLength(ContentRange);
  }
  writeStream.close();
};

export default async (bucket,key,size) => {
  const d = await downloadInChunks({
    bucket,
    key,
    size
  });
};