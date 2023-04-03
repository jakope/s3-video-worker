import {promisify} from 'util';
import { exec } from 'child_process';
const execA = promisify(exec);
import pathToFfmpeg from 'ffmpeg-static';


export const run = async function(input){
    let error, success;
    try {
        await execA(`${pathToFfmpeg} ${input}`);    
        success = true;
        error = false;
    } catch (err) {
     error = err;   
     success = false;
    }
    console.log("success",success,"error",error);
    return {
        success,
        error
    }
}

export const runAsWorker = async function(input){
    let error, success;
    try {
        await execA(`${pathToFfmpeg} ${input}`);    
        success = true;
        error = false;
    } catch (err) {
     error = err;   
     success = false;
    }
    console.log("success",success,"error",error);
    return {
        success,
        error
    }
}