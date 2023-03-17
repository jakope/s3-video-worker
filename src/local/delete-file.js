import fs from 'fs';
import path from 'path';

export default async (filePath)=>{
    try {
          await fs.promises.access(filePath)
          fs.unlinkSync(filePath);
          return true
        } catch {
          return false
        }
}