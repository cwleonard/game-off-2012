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

app.post('/score/:n/:s', function(req, res, next) {

	var scoreObj = {
			"name": req.params.n,
			"score": req.params.s
	}
	
	scores.push(scoreObj);
	
	res.sendStatus(200);

});



app.get('/scores', function(req, res, next) {

	var fn = req.query.callback
	
	var data = JSON.stringify(scores);
	
	var js = fn + "(" + data + ");";
	
	res.send(js);

});




// ------------------------- start the listening

var server = app.listen(1337, function() {
	console.log('listening on port %d', server.address().port);
});
