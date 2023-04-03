
let isRunning = false;
import { ulid } from "ulidx";
import * as dotenv from 'dotenv'
dotenv.config()
import {
    Worker
  }  from "worker_threads";
import fs from 'fs';
import { dirname } from '../../dirname.js';
import { queue, dones, errors } from '../config/database.js';
import CommandBuilder from './ffmpeg-command-builder-node.js';
const s3Url = process.env.S3_URL || "https://s3-eu-central-1.ionoscloud.com";
import path from 'path';

import {testHardwareAcceleration } from './ffmpeg-hwaccel.js';
// testHardwareAcceleration(`${dirname}output`).then((a)=>{
// console.log("a",a);
// })
//const testcommand = CommandBuilder.a(1920,1080).addVideoInput("./output/1.mp4").addOverlay("./output/1.png").addOverlay("./output/1.png","topright", 20).reencodeVideo().mp4("./output/2.mp4").logCommand().z();

export const upload = function(bucket, key,folder){
    return new Promise((resolve)=>{
    const worker = new Worker(dirname + "src/video/upload-folder.js", {workerData: {bucket,key, folder}});
      worker.on("message", msg => console.log("message",msg));
      worker.on("error", err => console.error("error",err));
      worker.on("exit", code => {
        resolve(true);
      });
    })
  }

  export const ffmpegWoker = function(command){
    return new Promise((resolve)=>{
    const worker = new Worker(dirname + "src/video/ffmpeg-worker.js", {workerData: {command}});
      worker.on("message", msg => console.log("message",msg));
      worker.on("error", err => console.error("error",err));
      worker.on("exit", code => {
        resolve(true);
      });
    })
  }



  export const cleanOutputFolder = async function(){
    try {
      await fs.promises.rm(`${dirname}output/*`, { recursive: true });
      console.log("output folder is clean");
    } catch (error) {
      
    }
  }


   async function executeNext(bucket, key, folder, options){
    console.log("run");
    isRunning = true;
    await cleanOutputFolder();
    try {
       let success;

       let ffmpegCommand;
       const outputFolder = `${dirname}output/${folder}`;
       const fileName = `${options.newKey}`;
       const outputKey = `${outputFolder}/${fileName}.mp4`
       fs.mkdirSync(path.dirname(outputKey), { recursive: true });
       const inputUrl = s3Url + "/" + bucket + "/" + key;
        console.log("format",options);

        if(options.method =="image"){
          ffmpegCommand = CommandBuilder.create(1920,1080).addImageInput(inputUrl,options.duration).pad().mp4(outputKey);
        }
        else if(options.method == "mp4"){
          ffmpegCommand = CommandBuilder.create(1920,1080).addVideoInput(inputUrl).pad()
          if(options.start && options.end){
            ffmpegCommand = ffmpegCommand.cut(options.start, options.end);
          }
          if(options.overlays){
            for (const overlay of options.overlays) {
              ffmpegCommand = ffmpegCommand.addOverlay(overlay.url, overlay.position, overlay.sizeInPercent);  
            }
          }
          ffmpegCommand = ffmpegCommand.mp4(outputKey);
        }else if(options && options.method == "merge"){
          let keys = options.keys.map((k)=>{
            return s3Url + "/" + bucket + "/" + k; 
          })
          ffmpegCommand = CommandBuilder.create().merge(keys,(concatText)=>{
            const mergePath = outputFolder + "/merge.txt";
            fs.writeFileSync(mergePath, concatText);
            return mergePath;
          }).mp4(outputKey);
        }
        await ffmpegWoker(ffmpegCommand?.toArray())
        if(success){
          await upload(bucket, key, folder)
        }    
        dones.push("/"+folder,{ bucket,key, folder, newKey : outputKey });
    } catch (error) {
      errors.push("/"+folder,{ bucket,key, folder });  
    }finally{
        queue.delete("/"+folder);
        //await cleanOutputFolder(); 
    }
    await new Promise((resolve)=>setTimeout(resolve, 50));
    isRunning = false;
    chooseNextToExecute();
    //return Promise.resolve(transcodeAndUploadSuccess);
  }

  const chooseNextToExecute = async function(){
    if(!isRunning){
      var queueData = await queue.getData("/");
      const keys = Object.keys(queueData);
      if(keys && keys[0]){
        const firstData = queueData[keys[0]];
        executeNext(firstData.bucket, firstData.key, firstData.folder, firstData.options);
      }
    }
  }

const add = function (bucket, key, options){
  const random = ulid();
  console.log("random",random);
  queue.push("/"+random,{ bucket,key, folder : random, options });
  chooseNextToExecute();
  return random;
}

const progress = async function(processid){
  const id = "/"+processid;
  try {
    const d = await dones.getData(id);
    console.log("d",d);
    return { success : true, error : false, progress : 100, key : d.bucket + d.newKey, msg : "done" };
  } catch (error) {
    
  }
  try {
    const e = await errors.getData(id);
    return { success : false, error : true, progress : 100};
  } catch (error) {
    
  }
  try {
    const p = await queue.getData(id);
    return { success : true, error : false, progress : 1, msg : "queued"};
  } catch (error) {
    
  }
  return { success : false, error : true, progress : 0};
  
}
const stats = async function(bucket,key){
    const inputUrl = s3Url + "/" + bucket + "/" + key;
    const b = await CommandBuilder.create().addVideoInput(inputUrl).stats();
    const answer = await b.run();
    const duration = b.extractStats(""+answer.error);
    console.log("duration,duration",duration);
    return answer;
}

export default {
 add,
 progress,
 stats
} 