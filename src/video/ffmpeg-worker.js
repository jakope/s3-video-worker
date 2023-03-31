import * as dotenv from 'dotenv'
dotenv.config()
import {parentPort, workerData} from "worker_threads";
import {spawn} from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
const { command } = workerData;

const run = async () => {
        console.log("command",command);
        const ls = spawn(pathToFfmpeg, command);
    
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
            return parentPort?.postMessage({success : true, error : false});
          }
          return parentPort?.postMessage({success : false, error : true});
        });
      }
run();