import fs from 'fs';
import path from 'path';
export default function cleanEmptyFoldersRecursively(folder) {
    var isDir = fs.statSync(folder).isDirectory();
    if (!isDir) {
      return;
    }
    var files = fs.readdirSync(folder);
    if (files.length > 0) {
      files.forEach(function(file) {
        var fullPath = path.join(folder, file);
        cleanEmptyFoldersRecursively(fullPath);
      });

      // re-evaluate files; after deleting subfolder
      // we may have parent folder empty now
      files = fs.readdirSync(folder);
    }

    if (files.length == 0) {
      
      fs.rmdirSync(folder);
      return;
    }
  }