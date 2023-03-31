import {
    Worker
  }  from "worker_threads";
import fs from 'fs';
import { dirname } from '../../dirname.js';
import CommandBuilder from './ffmpeg-command-builder.js';
const s3Url = process.env.S3_URL || "https://s3-eu-central-1.ionoscloud.com";
import path from 'path';

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
    const url = s3Url + "/" + bucket + "/" + key;
    const outputPath = `${dirname}output/${folder}/${key}`;
    const outputFolder = path.dirname(outputPath) + "/" + path.parse(outputPath).name;
    const fileName = path.parse(outputPath).name;
    const outputFolderAndFilename = `${outputFolder}/${fileName}.mp4`
    fs.mkdirSync(outputFolder, { recursive: true });
    
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