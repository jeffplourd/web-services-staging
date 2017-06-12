import db from '../dao/db';
import * as fs from 'fs';
import * as path from 'path';
import { eachSeries } from 'async';

const dir = path.resolve('./src/db/migrations/');
const files = fs.readdirSync(dir);

eachSeries(files, (fileName, cb) => {
  const content = fs.readFileSync(path.resolve(dir, fileName), { encoding: 'utf8' });
  db.raw(content)
    .then((rawInsertionData) => {
      console.log('rawInsertionData', rawInsertionData);
      cb(null, {});
    })
    .catch((error) => {
      console.log('getting an error');
      cb(error);
    })
}, () => {
  console.log('db.destroy()');
  db.destroy();
});
