const Twit = require('twit');
const mongoose = require('mongoose');
const Analyzer= require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmerEs;
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const analyzer = new Analyzer('Spanish',stemmer,'afinn');
const TweetSchema = new mongoose.Schema({
	created_at: String,
	text: String,
	location: String,
	language: String,
	sentiment: Boolean,
	score: Number
})

const useMongo= true;
var Tweet = mongoose.model('Tweet', TweetSchema);


const TwitterExtractor = new Twit({
  consumer_key:         'L1MRlxY1HYDn9LrfIFMMbvysE',
  consumer_secret:      '0pzp4f0u7o17XUmnqiwTZvjYV1735ExpqR5EwuZOskD3tiUM4C',
  access_token:         '349364409-2CC2qmGwFTkbu26Dr8Wj9Ueoz4POA0jTnOJgM1xm',
  access_token_secret:  'bMpN8giR8ouhRajTOpAdFGiBBTR7fdfVS1OIHs5O1UNq6',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})


/*
 * Get all tweets based on params sents
 *
 * Params:
 * q - Indicates the search query string
 * long - Longitude coordinate
 * lat - Latitude coordinate
 * radius - radius in Km
 * locationName - location of coordinates
 * slang - Defines search language
 * ttype - Define the tweet type
 * count - Define the number of desired tweets
*/
async function getTweets(req, res) {
	const params = req.body;

	const query = {
		q: params.q,
		lang: params.slang ? params.slang : 'es',
		locale: params.slang ? params.slang : 'es',
		result_type: params.ttype ? params.ttype : 'recent',
		count: params.count? params.count : 5000
	}

	if (params.lat && params.long && params.radius) {
		query['geocode'] = `${params.lat},${params.long},${params.radius}km`;		
	}
	
	TwitterExtractor.get('search/tweets', query, function(err, data, response) {

		console.log(data);
		
		if (useMongo) {
        
            data['statuses'].forEach(async function(tweet){
                if(!tweet.text.includes('RT')){
                const tokensList = tokenizer.tokenize(tweet.text);
				const sentimentScore = analyzer.getSentiment(tokensList);
				const sentiment= sentimentScore > 0 ? true : false
                  
                if (useMongo) {
                    // Store all tweets in database
                    const newTweet = new Tweet({
                        created_at: tweet.created_at,
                        text: tweet.text,
                        location: params.locationName ? params.locationName : '',
                        language: params.slang ? params.slang : 'es',
						score: sentimentScore,
						sentiment: sentiment,
                        retweet_count: tweet.retweet_count

                    });

 

                    newTweet.save(function(err, data){
                        if (err) {
                            console.log("Error!!")
                        } else {
                            console.log("Guardado")
                        }
                    });
                } else {
                    const data = {
                        created_at: tweet.created_at,
                        text: tweet.text,
                        location: params.locationName ? params.locationName : '',
                        language: params.slang ? params.slang : 'es'
                    }

 

                    const csv = new ObjectsToCsv([data])
                    await csv.toDisk('./comments.csv', {
                       append: true,
                       allColumns: true
                    })
                }
                  }
            })
        } else {
            const csv = new ObjectsToCsv(data['statuses'])
                 csv.toDisk('./comments.csv', {
                       append: true,
                       allColumns: true
                    })
        }

        
    });

	res.json({response: "Finish!!"});
}

module.exports = {
	getTweets
}