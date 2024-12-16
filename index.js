import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import router from './router.js';


dotenv.config();

const app = express();
const __dirname = path.resolve();
app.use(express.json());  
app.use(cors());
app.use('/firebase.js', express.static(path.join(__dirname, 'firebase.js')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'pages', '404.html'));
});

const getLocalNetworkAddress = () => {
  const interfaces = os.networkInterfaces();

  const localAddresses = Object.values(interfaces)
    .flatMap((items) => items.filter((item) => item.family === 'IPv4' && !item.internal))
    .map((item) => item.address);

  return localAddresses[0] || 'localhost';
};

const PORT = process.env.PORT || 3000;
const localNetworkAddress = getLocalNetworkAddress();

app.listen(PORT, () => {
  console.log(`  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Network: http://${localNetworkAddress}:${PORT}/`);
});