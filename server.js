var express = require("express");
var mbta = require('./mbta');
var fs = require('fs');
var preview = "<!doctype html>\n<html lang=\"en\">\n    <head>\n		<meta charset='utf-8'/>\n		<title>\n			Preview\n		</title>\n		<link rel=\"stylesheet\" href=\"http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.css\" />\n		<!--[if lte IE 8]>\n			<link rel=\"stylesheet\" href=\"http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.ie.css\" />\n		<![endif]-->\n		<style>\n			html { height: 100% }\n			body { height: 100%; margin: 0; padding: 0;}\n			#map{ height: 100% }\n		</style>\n	</head>\n	<body>\n		<div id=\"map\"></div>\n		<script src=\"http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.js\"></script>\n		<script>\n			function fileLoaded(geoJSON){\n				var map = L.map('map');\n				var geoJSONLayer = L.geoJson(geoJSON,{onEachFeature:function(feature,layer){\n					var key,popup;\n					if(feature.properties){\n						popup=\"<ul>\";\n						for(key in feature.properties){\n							popup += \"<li>\"\n							popup += key;\n							popup += \" : \";\n							popup += feature.properties[key];\n							popup += \"</li>\"\n						}\n						popup += \"</ul>\";\n						layer.bindPopup(popup);\n					}\n				}});\n				map.fitBounds(geoJSONLayer.getBounds());\n				L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {\n					attribution: 'Tiles Courtesy of <a href=\"http://www.mapquest.com/\">MapQuest</a> &mdash; Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>',\n					subdomains: '1234'\n				}).addTo(map);\n				geoJSONLayer.addTo(map);\n			}\n		</script>\n		<script src=\"./?callback=fileLoaded\"></script>\n	</body>\n</html>\n";

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
	res.set('Content-Type', 'text/html');
	res.send(preview);
});
app.get('/schedule/:route',function(req,res,next){
	mbta.schedule(req.params.route).then(function(result){
		res.jsonp(result);
	},function(err){
		res.jsonp(404,{status:"error",details:err});
	});
});
app.listen(process.env['PORT'] || 3000, '127.0.0.1');
