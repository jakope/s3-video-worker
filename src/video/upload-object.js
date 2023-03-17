import s3Client from "../config/s3-client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';


export default async (Key,filePath) => {
    
  const fileContent = await fs.promises.readFile(filePath);
  const command = new PutObjectCommand({
    Bucket : "athlyzertv",
    Key : Key,
    Body : fileContent,
    ACL : "public-read"
  });

  try {
    const response = await s3Client.send(command);
    console.log("done",filePath,Key);
  } catch (err) {
    console.error(err);
  }
};