var express = require('express');
var _ = require('lodash');
var bodyParser = require('body-parser');
var session = require('cookie-session');
var OpenTok = require('opentok');
var opentok = new OpenTok('44902802', 'd4337623ddbf97d1089425b6bed6617df1d4a8fd');

var app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/static/build'));
app.use(session({
    keys: ['this is ', 'super secret']
}));

var conferences = {};

/**
 * Create conference
 */
app.post('/api/conferences', function(req, res) {
	var conf = {
        name: req.body.name,
        participants: [],
        author: req.body.author
    };
    conferences[req.body.name] = conf;

    var sessionId;
	opentok.createSession({mediaMode:"relayed"}, function(error, result) {
  		if (error) {
	    	res.send(500, {error: 'Could not initialize opentok session.'})
	  	} else {
	  		conf.sessionId = result.sessionId;
	  	}

    	res.send(conf);
	});

});

app.get('/api/conferences/:name', function(req, res) {
	res.send(conferences[req.params.name]);
});

app.get('/api/conferences', function(req, res) {
    res.send(_.values(conferences));
});

/**
 * Join conference
 */
app.post('/api/conferences/:name/participants', function(req, res){
	var conf = conferences[req.params.name];
	var newParticipant = req.body;

	var options = {};
	if (newParticipant.name === conf.author) {
		options.role = 'moderator';
	}

	req.body.role = options.role || 'participant';

	token = opentok.generateToken(conf.sessionId, options);

	req.body.token = token;
	conf.participants.push(req.body);

	res.send(req.body);
});


app.listen(9555);