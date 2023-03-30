import * as dotenv from 'dotenv'
dotenv.config()
import {parentPort, workerData} from "worker_threads";
import DefaultRenditions from './resolutions.js';
import fs from 'fs';
import {spawn} from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import path from 'path';
import { dirname } from '../../dirname.js';

const {bucket, key, newKey, folder, duration } = workerData;

const s3Url = process.env.S3_URL || "https://s3-eu-central-1.ionoscloud.com";
const url = s3Url + "/" + bucket + "/" + key;
const outputPath = `${dirname}output/${folder}/${newKey}`;
const fileName = path.parse(outputPath).name;
const outputFolderAndFilename = `${outputPath}/${fileName}.mp4`
fs.mkdirSync(outputPath, { recursive: true });

const buildCommands = function(){
    return new Promise((resolve, reject) =>  {
      // let commands = ['-hide_banner', '-y', '-i', url, outputPath];
      // resolve(commands);
      console.log("duration",duration);
      let commands = ['-hide_banner', '-y', '-loop','1','-i', url, "-t", duration];
      const r = DefaultRenditions[3];
      console.log("r",r);
      commands = commands.concat(['-vf', `scale=w=${r.width}:h=${r.height}:force_original_aspect_ratio=1,pad=${r.width}:${r.height}:(ow-iw)/2:(oh-ih)/2`, '-c:a', 'aac', '-ar', '48000', '-c:v', 'h264', `-profile:v`, r.profile, '-crf', '20', '-sc_threshold', '0', '-g', '48', '-pix_fmt', 'yuv420p',outputFolderAndFilename])
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


