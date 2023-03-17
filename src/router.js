import express from 'express';
import Joi from 'joi';
import ExpressJoiValidator from 'express-joi-validation';
const validator = ExpressJoiValidator.createValidator({})
const router = express.Router();
const transcodeValidation = Joi.object({
    bucket: Joi.string().required(),
    key: Joi.string().required(),
});
import Transcoder from './video/index.js';
import headObject from './s3/head-object.js';

router.get("/",(req,res)=>{
    return res.send("Up and running");
});

router.get("/video/transcode",validator.query(transcodeValidation),async (req,res)=>{
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

export default router;