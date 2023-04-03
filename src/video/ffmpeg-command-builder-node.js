import {promisify} from 'util';
import { exec } from 'child_process';
const execA = promisify(exec);
import pathToFfmpeg from 'ffmpeg-static';
import CommandBuilder from './ffmpeg-command-builder.js';


export default class CommandBuilderNode extends CommandBuilder{
    constructor(){
        super(...arguments);
    }
    async run () {
        const input = this.toString();
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
}