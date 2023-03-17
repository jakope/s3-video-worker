
import s3Client from "../config/s3-client.js";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

export default async (bucket, key) => {
    try {
        
    
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
  
    const response = await s3Client.send(command);
    console.log("response",response);
    return response;
} catch (error) {
        return false;
}
  };