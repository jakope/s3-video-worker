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

export default class CommandBuilder{
    command = [];
    filterComplex1 = "";
    filterComplex2 = "";
    overlayInputIndex = 0;
    width;
    height;
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
    // static init = function(){
    //     videoCodec = ['-c:v', 'libx264', '-crf', '25'];
    //     audioCodec = ['-c:a', 'aac', '-strict', '-2', '-ar', '44100', '-b:a', '64k'];
    //     run(['-c:v', 'h264_videotoolbox']

    // }
    static create(width, height){
        console.log("this.width",width);
        return new this(width, height);
    }
    constructor(width, height){
        //super(...arguments);
        this.height = height;
        this.width = width;
        console.log("this.width",this.width);
    }
    add(command){
        this.command = this.command.concat(command);
    }
    addFilterComplex1(filter){
        this.filterComplex1 += filter;
    }
    addFilterComplex2(filter){
        this.filterComplex2 += filter;
    }
    addImageInput(url, duration = 1){
        this.add(['-hide_banner', '-y', '-hwaccel', 'auto', '-protocol_whitelist', 'file,http,https,tcp,tls','-loop','1','-i', url,'-f','lavfi','-i',`anullsrc=channel_layout=stereo:sample_rate=48000`,'-t',duration, '-framerate','1',]);
        return this;
    }
    addVideoInput(url){
        this.add(['-hide_banner', '-y', '-hwaccel', 'auto', '-protocol_whitelist', 'file,http,https,tcp,tls', '-i', url]);
        return this;
    }
    addOverlay(url, position = "lefttop", percent = 10){
        this.add(['-i',url]);
        
        this.overlayInputIndex+=1;

        let positionString = ""
        if(position.indexOf("left") > -1){
            positionString += "0:";
        }else if(position.indexOf("center") > -1){
            positionString += "w/2";
        }else{
            positionString += "W-w:";
        }
        if(position.indexOf("top") > -1){
            positionString += "0";
        }else if(position.indexOf("middle") > -1){
            positionString += "h/2";
        }else{
            positionString += "H-h";
        }
        const width = this.width * percent / 100;
        console.log("width",this.width, percent, width);
        const height = this.height * percent / 100;
        if(!this.filterComplex1){
            this.addFilterComplex1(`[0:v]   scale=w=${this.width}:h=${this.height}:force_original_aspect_ratio=decrease [videoinput${this.overlayInputIndex}]`);
        }
        this.addFilterComplex1(`;[${this.overlayInputIndex}:v] scale=${width}:${height}:force_original_aspect_ratio=decrease [ovrl${this.overlayInputIndex}]`)
        this.addFilterComplex2(`;[videoinput${this.overlayInputIndex}][ovrl${this.overlayInputIndex}] overlay=${positionString}[videoinput${this.overlayInputIndex+1}]`);
        return this;
    }
    cut(start,end){
        this.add(['-ss', start,'-to', end,'-avoid_negative_ts','make_zero','-copyts'])
        return this;
    }
    scale(){
        this.add([`[0:v]   scale=w=${this.width}:h=${this.height}:force_original_aspect_ratio=decrease [orig];`]);
        return this;
    }
    pad(){
        this.add(['-vf', `scale=w=${this.width}:h=${this.height}:force_original_aspect_ratio=1,pad=${this.width}:${this.height}:(ow-iw)/2:(oh-ih)/2`]);
        return this;
    }
    reencodeAudio(){
        this.add(['-c:a', 'aac', '-ar', '48000',]);
        return this;
    }
    reencodeVideo(quality){
        if(this.filterComplex1){
            this.add(['-filter_complex',`"${this.filterComplex1}${this.filterComplex2}"`,"-map",`[videoinput${this.overlayInputIndex+1}]`])
        }
        this.add(['-c:v', 'h264', `-profile:v`, 'main', '-crf', '20', '-sc_threshold', '0', '-g', '48']);
        return this;
    }
    mp4(filepath){
        if(filepath.indexOf(".mp4") == -1){
            filepath = filepath + ".mp4";
        }
        this.add(['-movflags', '+faststart','-max_muxing_queue_size', '9999',filepath]);
        return this;
    }
    logCommand(){
        console.log("logCommand",this.command.join(" "));
        return this;
    }
    toString(){
        return this.command.join(" ");
    }
    toArray(){
        return this.command;
    }
    
}