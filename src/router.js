import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import Joi from 'joi';
import ExpressJoiValidator from 'express-joi-validation';
const validator = ExpressJoiValidator.createValidator({})
const router = express.Router();
import {queue, errors, dones } from './config/database.js';
import listObjects from './s3/list-objects.js';
import Transcoder from './video/index.js';
import headObject from './s3/head-object.js';

router.get("/",(req,res)=>{
    return res.send("Up and running");
});

// router.use((req,res,next)=>{
//     if(req.query?.access_token == process.env.ACCESS_TOKEN){
//         next();
//     }else{
//         return res.status(404).send("Wrong access_token")
//     }
// });

router.post("/video/transcode",validator.body(Joi.object({
    access_token : Joi.string().required(),
    bucket: Joi.string().required(),
    key: Joi.string().required(),
})),async (req,res)=>{
    console.log("transcode video");
    const Bucket = req.body.bucket;
    const Key = req.body.key;
    console.log("key",Bucket + Key);
    const exists = await headObject(Bucket,Key);
    if(exists){
    console.log("exists",Bucket + Key);
      await Transcoder.add(Bucket,Key);
      return res.status(200).send("added" + Key);
    }else{
        return res.status(404);
    }
});

router.get("/video/progress",validator.query(Joi.object({
    access_token : Joi.string().required(),
    processid : Joi.string().required(),
})), async (req,res)=>{
    console.log("/video/progress",req.query);
    const progress = await Transcoder.progress(req.query.processid);
    console.log("progress at transcoder",progress);
    return res.json(progress);
});

router.post("/video/cut",validator.body(Joi.object({
    access_token : Joi.string().required(),
    bucket: Joi.string().required(),
    key: Joi.string().required(),
    newkey: Joi.string().required(),
    start : Joi.string().required(),
    end : Joi.string().required(),
})),async (req,res)=>{
    console.log("transcode video");
    const Bucket = req.body.bucket;
    const Key = req.body.key;
    const exists = await headObject(Bucket,Key);
    if(exists){
        const newKey = req.body.newkey;
      const processid = Transcoder.add(Bucket,Key,{ format : "mp4", method : "cut", newKey, start : req.body.start, end : req.body.end });
      return res.json({  success : true, error : false, processid });
    }else{
        return res.status(404);
    }
});

router.post("/video/merge",validator.body(Joi.object({
    access_token : Joi.string().required(),
})),async (req,res)=>{
    console.log("merge video");
    const Bucket = req.body.bucket;
    const Keys = req.body.keys;
    const newKey = req.body.newkey;
    for (const Key of Keys) {
        const exists = await headObject(Bucket,Key);
        if(!exists){
            return res.json({success : false, error : true, msg : "Does not exist"});
        }
    }
    const processid = Transcoder.merge(Bucket,Keys,{ format : "mp4", method : "merge", newKey});
    return res.json({  success : true, error : false, processid });
});



router.get("/list",validator.query(Joi.object({
    access_token : Joi.string().required(),
    bucket: Joi.string().required(),
})),async (req,res)=>{
    return res.json(await listObjects(req.query.bucket));
});

router.get("/queue",async (req,res)=>{
    return res.json(await queue.getData("/"));
});
router.get("/dones",async (req,res)=>{
    return res.json(await dones.getData("/"));
});
router.get("/errors",async (req,res)=>{
    return res.json(await errors.getData("/"));
});

export default router;