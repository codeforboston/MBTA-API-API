var request = require("request");
var q = require('q');
var parser = (new require('xml2js').Parser()).parseString;
var busBase = "http://webservices.nextbus.com/service/publicXMLFeed"
var subways = {
	red:"http://developer.mbta.com/lib/rthr/red.json",
	orange:"http://developer.mbta.com/lib/rthr/orange.json",
	blue:"http://developer.mbta.com/lib/rthr/blue.json"
};


var get$ = function(v){
	return v.$;
};
var parseDetails=function(raw){
	var route = raw.body.route[0]
	var out = route.$;
	out.directions=route.direction.map(function(v){
		var out = v.$;
		out.stops = v.stop.map(function(v){
			return v.$.tag;
		});
		return out;
	});
	out.stops = {}
	route.stop.forEach(function(v){
		out.stops[v.$.tag]=v.$;
	});
	out.paths = route.path.map(function(v){
		return v.point.map(function(v){
			return [v.$.lon,v.$.lat];
		});
	});
	return out;
}
var parsePrediction=function(raw){
	var list = [];
	raw.body.predictions.forEach(function(pred){
		var out = pred.$;
		out.directions={};
		if(!('direction' in pred)){
			return out;
		}
		pred.direction.forEach(function(v){
			out.directions[v.$.title]=v.prediction.map(get$);
		});
		list.push(out);
	});
	return list;
}
var parseLocations=function(raw){
	var fc={};
	fc.type = "FeatureCollection";
	fc.features=raw.body.vehicle.map(function(v){
		var feature = {};
		feature.type = "Feature";
		feature.properties = v.$;
		feature.geometry={
			"type": "Point",
			"coordinates": [feature.properties.lon,feature.properties.lat]
		}
		return feature;
	});
	if(raw.body.lastTime&&raw.body.lastTime.length){
		fc.properties={
			time : parseInt(raw.body.lastTime[0].$.time,10)
		};
	}
	return fc;
}
exports.list=function(cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	request({
			url:busBase,
			qs:{
				command:"routeList",
				a:"mbta"
			}
		},function(e,r,b){
			if(e){
				def.reject(e);
			}else{
				parser(b,function(err,result){
					if(err){
						def.reject(err);
					}else{
						def.resolve({routes:result.body.route.map(get$)});
					}
				})
			}
		});
	return def.promise;
}
exports.route=function(r,cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	request({
			url:busBase,
			qs:{
				command:"routeConfig",
				a:"mbta",
				r:r
			}
		},function(e,r,b){
			if(e){
				def.reject(e);
			}else{
				parser(b,function(err,result){
					if(err||!result.body.route){
						def.reject(err);
					}else{
						def.resolve(parseDetails(result));
					}
				})
			}
		});
	return def.promise;
}
exports.stop = function(stop,cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	request({
			url:busBase,
			qs:{
				command:"predictions",
				a:"mbta",
				stopId:stop
			}
		},function(e,r,b){
			if(e){
				def.reject(e);
			}else{
				parser(b,function(err,result){
					if(err){
						def.reject(err);
					}else{
						def.resolve(parsePrediction(result));
					}
				})
			}
		});
	return def.promise;
}
exports.subway = function(line,cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	if(line in subways){
		request({
			url:subways[line],
		},function(e,r,b){
			if(e){
				def.reject(e);
			}else{
				def.resolve(JSON.parse(b));
			}
		});
	}
	return def.promise;
}
exports.loc = function(route,since,cb){
	if(typeof since === "function"){
		cb = since;
		since=0;
	}else{
		since = since||0;
	}
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	request({
			url:busBase,
			qs:{
				command:"vehicleLocations",
				a:"mbta",
				r:route,
				t:since
			}
		},function(e,r,b){
			if(e){
				def.reject(e);
			}else{
				parser(b,function(err,result){
					if(err){
						def.reject(err);
					}else{
						def.resolve(parseLocations(result));
					}
				})
			}
		});
	return def.promise;
}
