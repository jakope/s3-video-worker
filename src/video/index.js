
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
  
export const transcode = function(bucket, key, folder){
    return new Promise((resolve)=>{
    const worker = new Worker(dirname + "src/video/transcode.js", {workerData: {bucket,key,folder }});
    worker.on("message", msg => {
      console.log("msg",msg);
      if(msg){
        resolve(true)
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
   async function doWork(bucket, key, folder){
    console.log("run");
    let transcodeAndUploadSuccess = false;
    isRunning = true;
    const outputPath = `${dirname}output/${folder}/${key}`;
    try {
        await fs.promises.rmdir(outputPath, { recursive: true });
    } catch (error) {
        
    }
    try {
        console.log("mkdir");
        await fs.promises.mkdir(outputPath, { recursive : true});
        console.log("after");
        const success = await transcode(bucket,key,folder);
        if(success){
          await upload(bucket, key, folder)
        }    
        transcodeAndUploadSuccess = true;
    } catch (error) {
        
    }finally{
        await fs.promises.rmdir(outputPath, { recursive: true });    
    }
    await new Promise((resolve)=>setTimeout(resolve, 50));
    if(transcodeAndUploadSuccess){
      dones.push("/"+folder,{ bucket,key, folder });
    }else{
      errors.push("/"+folder,{ bucket,key, folder });
    }
    queue.delete("/"+folder);
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
        doWork(firstData.bucket, firstData.key, firstData.folder);
      }
    }
  }

const add = function (bucket, key){
  const random = ulid();
  console.log("random",random);
  queue.push("/"+random,{ bucket,key, folder : random });
  executeNext();
}

export default {
 add
} 