import fs from 'fs';
import path from 'path';

export default function readDir(target, files = []) {

  if(fs.statSync(target).isDirectory()) {
    fs.readdirSync(target)
      .filter(item => !(/(^|\/)\.[^/.]/g).test(item))
      .forEach(
        item => readDir(path.join(target, item), files)
      );
  } else {
    files.push(target);
  }

  return files;
}
