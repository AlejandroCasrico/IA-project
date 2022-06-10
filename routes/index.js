var express = require('express');
var router = express.Router();
const getTweets = require('../tweetExtractor.controller').getTweets

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET tweets based on params */
router.post('/get-tweets', getTweets);

module.exports = router;
