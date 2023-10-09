require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const API = require('./inc/API');

const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

const api = new API();
app.use('/api', api.router);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
