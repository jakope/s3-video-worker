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

router.use((req,res,next)=>{
    if(req.query?.access_token == process.env.ACCESS_TOKEN){
        next();
    }else{
        return res.status(404).send("Wrong access_token")
    }
});

router.get("/video/transcode",validator.query(Joi.object({
    access_token : Joi.string().required(),
    bucket: Joi.string().required(),
    key: Joi.string().required(),
})),async (req,res)=>{
    console.log("transcode video");
    const Bucket = req.query.bucket;
    const Key = req.query.key;
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

router.get("/video/cut",validator.query(Joi.object({
    access_token : Joi.string().required(),
    bucket: Joi.string().required(),
    key: Joi.string().required(),
    start : Joi.string().required(),
    end : Joi.string().required(),
})),async (req,res)=>{
    console.log("transcode video");
    const Bucket = req.query.bucket;
    const Key = req.query.key;
    const exists = await headObject(Bucket,Key);
    if(exists){
    console.log("exists",Bucket + Key);
      await Transcoder.add(Bucket,Key,{ format : "mp4", start : req.query.start, end : req.query.end });
      return res.status(200).send("added" + Key);
    }else{
        return res.status(404);
    }
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