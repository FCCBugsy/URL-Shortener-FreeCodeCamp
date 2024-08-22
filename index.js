// Basic Configuration
const port = process.env.PORT || 3000;
const dns = require('dns');
const url = require('url');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ======================= //
// if you cloned the git repo, make sure to install "dotenv", and "mongoose" with npm

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: Number,
});

// Models
const Url = mongoose.model('Url', urlSchema);

// Functions to generate a random number
const urlArray = [];
const generateRandomNumber = () => {
  const number = Math.floor(Math.random() * 10000);
  if (urlArray.includes(number)) {
    return generateRandomNumber();
  }

  urlArray.push(number);
  return number; // MAKE SURE TO RETURN THE NUMBER!! Otherwise, it will return undefined or null
};


// POST Calls
// create a new short URL
const httpRegex = /https?:\/\/(www\.)?/i;

app.post('/api/shorturl', (req, res) => {
  const oriUrl = req.body.url;

  try {
    if (!httpRegex.test(oriUrl)) {
      return res.json({ error: 'invalid url' });
    }

    const parsedUrl = url.parse(oriUrl);
    const hostname = parsedUrl.hostname;

    // check if dns successful
    dns.lookup(hostname, async (err, _address, _family) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // if dns succseful, we save in the database
      const shortUrl = generateRandomNumber();
      const newUrl = new Url({ originalUrl: oriUrl, shortUrl });

      try {
        await newUrl.save();
        res.json({ original_url: newUrl.originalUrl, short_url: shortUrl });
      } 
      
      catch (saveError) {
        res.json({ error: "couldn't save url in the db" });
      }
    });

  } 
  
  catch (error) {
    res.json({error: 'invalid url'})
    console.log(error);
  }
});

// GET Calls
// redirect to the original URL
app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;

  try {
    const data = await Url.findOne({ shortUrl: shortUrl });
    // console.log(data); 

    if (!data) return res.status(404).send('Short URL not found');
    res.redirect(data.originalUrl);
  } 
  
  catch (err) {
    res.send('Error finding short URL');
    console.error(err);
  }
});


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
