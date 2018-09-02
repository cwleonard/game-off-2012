var express = require('express');
var fs = require('fs');
var http = require('http');
var escape = require('escape-html');

var app = express();

var HIGHSCORES_FILE = 'highscores.json';

var scores;

try {
	scores = JSON.parse(fs.readFileSync(HIGHSCORES_FILE, { encoding: 'utf-8' }));
} catch (e) {
	console.log(e);
	scores = [];
}

function arrangeScores() {
	
	scores.sort(function(a, b) {
	    return b.score - a.score;
	});
	scores = scores.slice(0, 10);
	
}


app.get('/checkScore/:s', function(req, res, next) {

	var s = Number(req.params.s);
	
	var fn = req.query.callback
	var highScore = false;
	
	arrangeScores();
	if (scores.length < 10 || s > scores[scores.length-1].score) {
		highScore = true;
	}
	
	var data = {
			"shouldPrompt": highScore,
			"score": s
	}
	
	var js = fn + "(" + JSON.stringify(data) + ");";
	
	res.setHeader('Content-Type', 'application/javascript');
	res.send(js);

});

app.get('/score/:n/:s', function(req, res, next) {

	var scoreObj = {
			"name": escape(req.params.n).substring(0, 16),
			"score": escape(req.params.s)
	}
	scores.push(scoreObj);
	
	var fn = req.query.callback
	var js = fn + "();";
	
	res.setHeader('Content-Type', 'application/javascript');
	res.send(js);

});

app.get('/scores', function(req, res, next) {

	var fn = req.query.callback

	arrangeScores();
	
	var data = JSON.stringify(scores);
	
	var js = fn + "(" + data + ");";
	
	res.setHeader('Content-Type', 'application/javascript');
	res.send(js);

});


function saveHighScores() {
	
	fs.writeFile(HIGHSCORES_FILE, JSON.stringify(scores), function(err) {
		if (err) {
			console.log(err);
		} else {
			//console.log("saved high scores");
		}
		setTimeout(saveHighScores, 300000);
	});
	
}

setTimeout(saveHighScores, 300000);

// ------------------------- start the listening

var server = app.listen(2000, function() {
	console.log('listening on port %d', server.address().port);
});
