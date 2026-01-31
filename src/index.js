import express from 'express';
import matchRouter from './routes/matches.js';

const app = express();
const PORT = 8000;

app.use(express.json());



app.use('/matches', matchRouter);



app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server is running on ${url}`);
});
