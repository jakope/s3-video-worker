import client from "./client-aws.js";
import {
  // This command supersedes the ListObjectsCommand and is the recommended way to list objects.
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";


export default async () => {
  const command = new ListObjectsV2Command({
    Bucket : "athlyzertv",
    // The default and maximum number of keys returned is 1000. This limits it to
    // one for demonstration purposes.
    MaxKeys: 1,
  });

  try {
    let isTruncated = true;
    let all = [];
    
    let contents = "";
    
    while (isTruncated) {
        try {      
      const { Contents, IsTruncated, NextContinuationToken } = await client.send(command);
    //   const contentsList = Contents.map((c) => ` • ${c.Key}`).join("\n");
    //   contents += contentsList + "\n";
      all = all.concat(Contents);
      isTruncated = IsTruncated;
      command.input.ContinuationToken = NextContinuationToken;
    } catch (error) {
     
    }
    }
    
    return all;

  } catch (err) {
    console.error(err);
  }
};