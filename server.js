var express = require("express");
var mbta = require('./mbta');
var app = express();
app.use(express.logger());
app.use(express.compress());


app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});
app.get('/',function(req,res,next){
	res.jsonp({
		"list of routes":'/list',
		"details of a route":"/route/[route id]",
		"details of a stop":"/stop/[stop id]",
		"geojson of current location on a route":"/locations/[route]",
		"map of route":"/locations/[route]/preview",
		"schedule of a route":"/schedule/[route]",
		"subway line":"/[line]"
	});
});
app.get('/list',function(req,res,next){
	mbta.list().then(function(result){
		res.jsonp(result);
	},function(err){
		res.jsonp(404,{status:"error",details:err});
	});
});
app.get('/route/:route',function(req,res,next){
	mbta.route(req.params.route).then(function(result){
		res.jsonp(result);
	},function(err){
		res.jsonp(404,{status:"error",details:err});
	});
});
app.get('/stop/:stop',function(req,res,next){
	mbta.stop(req.params.stop).then(function(result){
		res.jsonp(result);
	},function(err){
		res.jsonp(404,{status:"error",details:err});
	});
});
app.get('/:line',function(req,res,next){
	mbta.subway(req.params.line).then(function(result){
		res.jsonp(result);
	},function(err){
		res.jsonp(404,{status:"error",details:err});
	});
});
app.get('/locations/:route',function(req,res,next){
	mbta.locations(req.params.route).then(function(result){
		res.jsonp(result);
	},function(err){
		res.jsonp(404,{status:"error",details:err});
	});
});
app.get('/locations/:route/preview',function(req,res,next){
	res.sendfile("./preview.html")
});
app.get('/schedule/:route',function(req,res,next){
	mbta.schedule(req.params.route).then(function(result){
		res.jsonp(result);
	},function(err){
		res.jsonp(404,{status:"error",details:err});
	});
});
app.listen(process.env['PORT'] || 3000, '127.0.0.1');
