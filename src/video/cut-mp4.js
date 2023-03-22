import * as dotenv from 'dotenv'
dotenv.config()
import {parentPort, workerData} from "worker_threads";
import DefaultRenditions from './resolutions.js';
import fs from 'fs';
import {spawn} from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import path from 'path';
import { dirname } from '../../dirname.js';

const {bucket, key, folder, newKey, start, end } = workerData;
console.log("newKey",newKey);
const s3Url = process.env.S3_URL || "https://s3-eu-central-1.ionoscloud.com";
const url = s3Url + "/" + bucket + "/" + key;
const outputPath = `${dirname}output/${folder}/${key}`;
const outputFolder = path.dirname(outputPath) + "/" + path.parse(key).name;
const fileName = path.parse(newKey).name;
const outputFolderAndFilename = `${outputFolder}/${fileName}.mp4`
fs.mkdirSync(outputFolder, { recursive: true });

const buildCommands = function(){
    return new Promise((resolve, reject) =>  {
      // let commands = ['-hide_banner', '-y', '-i', url, outputPath];
      // resolve(commands);
      let commands = ['-hide_banner', '-y', '-i', url];
      if(start && end){
        commands = commands.concat(['-ss', start,'-to', end,'-avoid_negative_ts','make_zero','-copyts']);
      }
        const r = DefaultRenditions[3];
        console.log("r",r);
        commands = commands.concat(['-vf', `scale=w=${r.width}:h=${r.height}:force_original_aspect_ratio=decrease`, '-c:a', 'aac', '-ar', '48000', '-c:v', 'h264', `-profile:v`, r.profile, '-crf', '20', '-sc_threshold', '0', '-g', '48', outputFolderAndFilename])
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


