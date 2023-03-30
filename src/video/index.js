
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
import CommandBuilder from './ffmpeg-command-builder.js';


const testcommand = CommandBuilder.a(1920,1080).addVideoInput("./output/1.mp4")
.addOverlay("./output/1.png")
.addOverlay("./output/1.png","topright", 20).reencodeVideo().mp4("./output/2.mp4").logCommand().z();

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

  export const mergeMp4 = function(bucket,keys,folder,newKey){
    return new Promise((resolve)=>{
      const worker = new Worker(dirname + "src/video/merge-mp4.js", {workerData: {bucket,keys,folder, newKey }});
      worker.on("message", msg => {
        console.log("msg",msg);
        if(msg){
          resolve(msg)
        }else{
          console.log("merge did not work");
          resolve(false);
        }
      });
      worker.on("error", err => console.error("error",err));
      worker.on("exit", code => {
          
      });
      })
  }

  export const cutMp4 = function(bucket, key, folder, newKey, start, end){
    return new Promise((resolve)=>{
    const worker = new Worker(dirname + "src/video/cut-mp4.js", {workerData: {bucket,key,folder, newKey,start, end }});
    worker.on("message", msg => {
      console.log("msg",msg);
      if(msg){
        resolve(msg)
      }else{
        console.log("transcode did not work");
        resolve(false);
      }
    });
    worker.on("error", err => console.error("error",err));
    worker.on("exit", code => {
        
    });
    })
  }
  
export const transcode = function(bucket, key, folder){
    return new Promise((resolve)=>{
    const worker = new Worker(dirname + "src/video/transcode.js", {workerData: {bucket,key,folder }});
    worker.on("message", msg => {
      console.log("msg",msg);
      if(msg){
        resolve(msg)
      }else{
        console.log("transcode did not work");
        resolve(false);
      }
    });
    worker.on("error", err => console.error("error",err));
    worker.on("exit", code => {
        
    });
    })
  }

  export const transcodeMp4 = function(bucket, key, folder, start, end){
    return new Promise((resolve)=>{
    const worker = new Worker(dirname + "src/video/transcode-mp4.js", {workerData: {bucket,key,folder, start, end }});
    worker.on("message", msg => {
      console.log("msg",msg);
      if(msg){
        resolve(msg)
      }else{
        console.log("transcode did not work");
        resolve(false);
      }
    });
    worker.on("error", err => console.error("error",err));
    worker.on("exit", code => {
        
    });
    })
  }

  export const transcodeImageMp4 = function(bucket, key, folder, newKey,duration){
    return new Promise((resolve)=>{
    const worker = new Worker(dirname + "src/video/transcode-image-to-video.js", {workerData: {bucket,key,folder, newKey,duration}});
    worker.on("message", msg => {
      console.log("msg",msg);
      if(msg){
        resolve(msg)
      }else{
        console.log("transcode did not work");
        resolve(false);
      }
    });
    worker.on("error", err => console.error("error",err));
    worker.on("exit", code => {
        
    });
    })
  }


   async function doWork(bucket, key, folder, options){
    console.log("run");
    isRunning = true;
    const outputPath = `${dirname}output/${folder}/${key}`;
    try {
        await fs.promises.rmdir(outputPath, { recursive: true });
    } catch (error) {
        
    }
    try {
        await fs.promises.mkdir(outputPath, { recursive : true});
        let success;
        console.log("format",options);
        if(options && options.method == "merge"){
          success = await mergeMp4(bucket,key,folder,options.newKey);
        }else if(options && options.method == "cut"){
          success = await cutMp4(bucket,key,folder,options.newKey,options.start, options.end);
        }else if(options && options.method == "image"){
          success = await transcodeImageMp4(bucket,key,folder,options.newKey,options.duration);
        }else if(options && options.format == "mp4"){
          success = await transcodeMp4(bucket,key,folder,options.start, options.end);
        }else{
          success = await transcode(bucket,key,folder);
        }
        console.log("success",success);
        if(success){
          await upload(bucket, key, folder)
        }    
        dones.push("/"+folder,{ bucket,key, folder, newKey : success.split(folder)[1] });
    } catch (error) {
      errors.push("/"+folder,{ bucket,key, folder });  
    }finally{
        queue.delete("/"+folder);
        await fs.promises.rmdir(outputPath, { recursive: true });    
    }
    await new Promise((resolve)=>setTimeout(resolve, 50));
    isRunning = false;
    executeNext();
    //return Promise.resolve(transcodeAndUploadSuccess);
  }

  const executeNext = async function(){
    if(!isRunning){
      var queueData = await queue.getData("/");
      const keys = Object.keys(queueData);
      if(keys && keys[0]){
        const firstData = queueData[keys[0]];
        doWork(firstData.bucket, firstData.key, firstData.folder, firstData.options);
      }
    }
  }

const add = function (bucket, key, options){
  const random = ulid();
  console.log("random",random);
  queue.push("/"+random,{ bucket,key, folder : random, options });
  executeNext();
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

export default {
 add,
 progress
} 