import * as dotenv from 'dotenv'
dotenv.config()
import {parentPort, workerData} from "worker_threads";

import { createReadStream, promises } from 'fs';
import { resolve, join } from 'path';
import uploadObject from './upload-object.js';
const {bucket, folder } = workerData;
const { readdir, stat: getStats } = promises;

import { dirname } from '../../dirname.js';

// upload file
const uploadFile = async function uploadFile({ path, params, options } = {}) {
  const parameters = { ...params };
  console.log(parameters);
  const opts = { ...options };
  await uploadObject(parameters.Key, path);
  return true;
};

// upload directory and its sub-directories if any
const uploadDirectory = async function uploadDirectory({
  path,
  params,
  options,
  rootKey,
} = {}) {
  const parameters = { ...params };
  const opts = { ...options };
  const root = rootKey && rootKey.constructor === String ? rootKey : '';
  let dirPath;

  try {
    dirPath = resolve(path);
    const dirStats = await getStats(dirPath);

    if (!dirStats.isDirectory()) {
      throw new Error(`${dirPath} is not a directory`);
    }

    console.info(`uploading directory ${dirPath}...`);

    const filenames = await readdir(dirPath);

    if (Array.isArray(filenames)) {
      await Promise.all(filenames.map(async (filename) => {
        const filepath = `${dirPath}/${filename}`;
        const fileStats = await getStats(filepath);

        if (fileStats.isFile()) {
          parameters.Key = join(root, filename);
          await uploadFile({
            path: filepath,
            params: parameters,
            options: opts,
          });
        } else if (fileStats.isDirectory()) {
          await uploadDirectory({
            params,
            options,
            path: filepath,
            rootKey: join(root, filename),
          });
        }
      }));
    }
  } catch (e) {
    throw new Error(`unable to upload directory ${path}, ${e.message}`);
  }

  console.info(`directory ${dirPath} successfully uploaded`);
  return true;
};

// example
(async () => {
  try {
    console.time('s3 upload',folder);

    await uploadDirectory({
      path: `${dirname}output/${folder}`,
      params: {
        Bucket : bucket,
      },
      options: {},
      rootKey: '',
    });

    console.timeEnd('s3 upload');
  } catch (e) {
    console.error(e);
  }
})();