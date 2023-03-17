import * as dotenv from 'dotenv'
dotenv.config()
import {
    Worker
  }  from "worker_threads";
const bucket = process.argv[2];
const key = process.argv[3];
import { add } from './transcode.js';

async function run(){
  add(bucket,key);
}
run();