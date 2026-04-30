const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');
const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1'
];

files.forEach(file => {
  const dest = path.join(modelsDir, file);
  const fileStream = fs.createWriteStream(dest);
  https.get(baseUrl + file, response => {
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log('Downloaded', file);
    });
  });
});
