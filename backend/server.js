const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;


app.use(cors());

app.get('/sphere-data', (req, res) => {
  res.json({
    id: req.query.id,
    name: `Sphere ${req.query.id}`,
    description: `This is the description for sphere ${req.query.id}.`
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});