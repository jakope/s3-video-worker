/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import s3Client from "../config/s3-client.js";
import {readChunkSync} from 'read-chunk';
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const twentyFiveMB = 25 * 1024 * 1024;


export default async (bucket,key,size) => {
  const bucketName = "athlyzertv";
  let uploadId;
  const filePath = `./${key}`;
  const multiUploadKey = bucket + "/" + key;

  try {
    const multipartUpload = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: multiUploadKey,
        ACL : "public-read"
      })
    );

    uploadId = multipartUpload.UploadId;

    const uploadPromises = [];
    // Multipart uploads require a minimum size of 5 MB per part.
    const partSize = Math.min(
      1024 * 1024 * 10,
      size
    );
    const numberOfparts = Math.ceil(size / partSize);
    console.log(`++++++ numberOfparts ${numberOfparts} and partSize ${partSize}`);
    // Upload each part.

    //const startTime = new Date().getTime();

    for (let i = 0; i < numberOfparts; i++) {
      const part = parseInt(i + "");
      const start = i * partSize;
      uploadPromises.push(
        s3Client
          .send(
            new UploadPartCommand({
              Bucket: bucketName,
              Key : multiUploadKey,
              UploadId: uploadId,
              Body: readChunkSync(filePath, {length: partSize, startPosition: start}),
              PartNumber: i + 1,
            })
          )
          .then((d) => {
            // const elapsedTime = (new Date().getTime()) - startTime;
            // var chunksPerTime = part / elapsedTime;
            // var estimatedTotalTime = numberOfparts / chunksPerTime;
            // var timeLeftInSeconds = (estimatedTotalTime - elapsedTime) / 1000;
            // var seconds = Math.round(timeLeftInSeconds);
            // var calculatedTime = new Date( null );
            // calculatedTime.setSeconds( seconds );
            // var newTime = calculatedTime.toISOString().substr( 11, 8 );
            const p = Math.floor(part / numberOfparts)*100;
            console.log(`++++++ progress ${p}`);
            return d;
          })
      );
    }

    const uploadResults = await Promise.all(uploadPromises);

    return await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: multiUploadKey,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: uploadResults.map(({ ETag }, i) => ({
            ETag,
            PartNumber: i + 1,
          })),
        },
      })
    );

    // Verify the output by downloading the file from the Amazon Simple Storage Service (Amazon S3) console.
    // Because the output is a 25 MB string, text editors might struggle to open the file.
  } catch (err) {
    console.error(err);

    if (uploadId) {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: multiUploadKey,
        UploadId: uploadId,
      });

      await s3Client.send(abortCommand);
      
    }
  }
};