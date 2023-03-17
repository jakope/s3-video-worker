import s3Client from "../config/s3-client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';


export default async (Bucket,Key) => {
    const filePath = `./${Key}`;
    const fileContent = await fs.promises.readFile(filePath);
  const command = new PutObjectCommand({
    Bucket : "athlyzertv",
    Key : Bucket + "/" + Key,
    Body : fileContent,
  });

  try {
    const response = await s3Client.send(command);
    
  } catch (err) {
    console.error(err);
  }
};