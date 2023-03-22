import * as dotenv from 'dotenv'
dotenv.config()
import {parentPort, workerData} from "worker_threads";
import DefaultRenditions from './resolutions.js';
import fs from 'fs';
import {spawn} from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import path from 'path';
import { dirname } from '../../dirname.js';
console.log("pathTOF",pathToFfmpeg);

const {bucket, key, folder, start, end } = workerData;

const s3Url = process.env.S3_URL || "https://s3-eu-central-1.ionoscloud.com";
const url = s3Url + "/" + bucket + "/" + key;
const outputPath = `${dirname}output/${folder}/${key}`;
const outputFolder = path.dirname(outputPath) + "/" + path.parse(outputPath).name;

fs.mkdirSync(outputFolder, { recursive: true });

const buildCommands = function(){
    return new Promise((resolve, reject) =>  {
      // let commands = ['-hide_banner', '-y', '-i', url, outputPath];
      // resolve(commands);
      let commands = ['-hide_banner', '-y', '-i', url];
      if(start && end){
        commands = commands.concat(['-ss', start,'-to', end,'-avoid_negative_ts','make_zero','-copyts']);
      }
      const renditions = DefaultRenditions;
      for (let i = 0, len = renditions.length; i < len; i++){
        const r = renditions[i];
        console.log("r",r);
        commands = commands.concat(['-vf', `scale=w=${r.width}:h=${r.height}:force_original_aspect_ratio=decrease`, '-c:a', 'aac', '-ar', '48000', '-c:v', 'h264', `-profile:v`, r.profile, '-crf', '20', '-sc_threshold', '0', '-g', '48', '-hls_time', r.hlsTime, '-hls_playlist_type', 'vod', '-b:v', r.bv, '-maxrate', r.maxrate, '-bufsize', r.bufsize, '-b:a', r.ba, '-hls_segment_filename', `${outputFolder}/${r.ts_title}_%03d.ts`, `${outputFolder}/${r.height}.m3u8`])
      }
       resolve(commands);
    });
  }

  const writePlaylist = function(){
    return new Promise(async (resolve, reject) =>  {
     let m3u8Playlist =  `#EXTM3U
#EXT-X-VERSION:3`;
      const renditions = DefaultRenditions;
      
      for (let i = 0, len = renditions.length; i < len; i++){
        const r = renditions[i];
        m3u8Playlist += `
#EXT-X-STREAM-INF:BANDWIDTH=${r.bv.replace('k', '000')},RESOLUTION=${r.width}x${r.height}
${r.height}.m3u8`
      }
      const m3u8Path = `${outputFolder}/index.m3u8`
      fs.writeFileSync(m3u8Path, m3u8Playlist);

      resolve(m3u8Path);

    })
  }

const run = async () => {
        const commands  = await buildCommands();
        const masterPlaylist = await writePlaylist();
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
            return parentPort?.postMessage(masterPlaylist);
          }
            ;
          return parentPort?.postMessage(false);
          
        })
      }

      run();


