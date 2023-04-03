import {promisify} from 'util';
// import { exec } from 'child_process';
// const execA = promisify(exec);
import {execa} from 'execa';
import pathToFfmpeg from 'ffmpeg-static';
import CommandBuilder from './ffmpeg-command-builder.js';
import { Writable } from 'stream'

export default class CommandBuilderNode extends CommandBuilder{
    constructor(){
        super(...arguments);
    }
    duration;
    bitrate;

    async run () {
        //const input = this.toString();
        let error, success;
        try {
            console.log("run",this.command);
            // await execA(`${pathToFfmpeg} ${input}`);
            let self = this;
            const myWriteStream = new Writable({
                write(data, encoding, callback) {
                    const str = data.toString();
                  if(!self.duration){
                    const duration = self.extractDuration(str);
                    if(duration){
                        //self.bitrate = self.extractBitrate(str);
                        self.duration = duration;
                    }
                }else{
                    const time = self.extractTime(str);
                    if(time){
                        console.log(self.calculateProgress(time,self.duration));
                    }
                    
                }
                  callback();
                }
              });  
              
            const childProcess = execa(`${pathToFfmpeg}`, this.command, { all: true, stdout : "pipe"  }).pipeAll(myWriteStream)
            await childProcess;
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
}