import * as dotenv from 'dotenv'
dotenv.config()
import {parentPort, workerData} from "worker_threads";
import DefaultRenditions from './resolutions.js';
import fs from 'fs';
import {spawn} from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import path from 'path';
import { dirname } from '../../dirname.js';

const {bucket, keys, folder, newKey } = workerData;

const s3Url = process.env.S3_URL || "https://s3-eu-central-1.ionoscloud.com";

const outputPath = `${dirname}output/${folder}/${newKey}`;
const outputFolder = path.dirname(outputPath) + "/" + path.parse(outputPath).name;
const fileName = path.parse(outputPath).name;
const outputFolderAndFilename = `${outputFolder}/${fileName}.mp4`
fs.mkdirSync(outputFolder, { recursive: true });

const buildCommands = function(){

    let concatText = '';
    let fileFormat;

    for (const key of keys) {
      let videourl = s3Url + "/" + bucket + "/" + key; 
      fileFormat = videourl.indexOf('.webm') > -1 ? 'webm' : 'mp4';
      concatText = concatText + "file '";
      concatText = concatText + videourl + "'\n";
    }

    let mergeTXTpath = path
      .join(outputFolder, 'merge.txt')
      .replace(/\\/g, '/');

    fs.writeFileSync(mergeTXTpath, concatText);

    let filePath = path
      .join(outputFolder, fileName + '.' + fileFormat)
      .replace(/\\/g, '/');
      
    return new Promise((resolve, reject) =>  {
      let commands = ['-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      mergeTXTpath,
      '-c',
      'copy',
      filePath];
    resolve(commands);
    });
  }

const run = async () => {
        const commands  = await buildCommands();
        const ls = spawn(pathToFfmpeg, commands);
        console.log(pathToFfmpeg + " " + commands.join(" "));
        let showLogs = true;
        
        ls.stdout.on('data', (data) =>  {
          if (showLogs){
            console.log(data.toString());
          }
        });

        ls.stderr.on('data', (data) =>  {
          if (showLogs){
            console.log(data.toString());
          }
        });

        ls.on('exit', async (code) =>  {
          if (showLogs){
            console.log(`Child exited with code ${code}`);
          }
          if (code == 0) {
            return parentPort?.postMessage(outputFolderAndFilename);
          }
            ;
          return parentPort?.postMessage(false);
          
        })
      }

      run();


