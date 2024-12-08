import fs from 'fs';
import path from 'path';
import express from 'express';
import { pathToFileURL } from 'url';


const router = express.Router();
const __dirname = path.resolve();

const publicDir = path.join(__dirname, 'public');
const apiDir = path.join(__dirname, 'api');
const pagesDir = path.join(publicDir, 'pages');

router.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

fs.readdir(pagesDir, (err, files) => {
  if (err) {
    process.exit(1);
  }

  files.forEach((file) => {
    if (path.extname(file) === '.html') {
      const route = `/${path.basename(file, '.html')}`;

      router.get(route, (req, res) => {
        res.sendFile(path.join(pagesDir, file));
      });
    }
  });
});

fs.readdir(apiDir, (err, files) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  files.forEach((file) => {
    if (path.extname(file) === '.js') {
      const route = `/api/${path.basename(file, '.js')}`;
      const filePath = pathToFileURL(path.join(apiDir, file));

      import(filePath).then((module) => {
        router.use(route, module.default);
      }).catch((err) => {
        console.error(`${file}：`, err);
      });
    }
  });
});

export default router;