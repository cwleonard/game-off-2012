var express = require('express');
var fs = require('fs');
var http = require('http');

var app = express();

var scores = [];


// test stuff
scores.push({
	"name":"casey",
	"score":34023
});

scores.push({
	"name":"rebecca",
	"score":1212
});

scores.push({
	"name":"alex",
	"score":12345
});



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
			"name": req.params.n,
			"score": req.params.s
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




// ------------------------- start the listening

var server = app.listen(1337, function() {
	console.log('listening on port %d', server.address().port);
});
