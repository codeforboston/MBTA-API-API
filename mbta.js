var request = require("request");
var q = require('q');
var parser = (new require('xml2js').Parser()).parseString;
var busBase = "http://webservices.nextbus.com/service/publicXMLFeed"
var subways = {
	red:"http://developer.mbta.com/lib/rthr/red.json",
	orange:"http://developer.mbta.com/lib/rthr/orange.json",
	blue:"http://developer.mbta.com/lib/rthr/blue.json"
};

function Cache(){
	var cache = {};
	this.check=function(code,def){
		if(code in cache){
			cache[code].then(function(a){
				def.resolve(a);
			},function(a){
				def.reject(a);
			});
			return false;
		}else{
			cache[code]=def.promise;
			setTimeout(function(){
				delete cache[code]
			},10000);
			return true;
		}
	}
}


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
			"coordinates": [parseFloat(feature.properties.lon,10),parseFloat(feature.properties.lat,10)]
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
var parseSched=function(raw){
	return raw.body.route.map(function(route){
		var out = route.$;
		var stops = {};
		route.header[0].stop.forEach(function(stop){
			stops[stop.$.tag]=stop._;
		});
		out.times=route.tr.map(function(row){
			var out = {};
			out.id = row.$.blockID;
			out.stops=row.stop.map(function(stop){
				var out = stop.$;
				out.name = stops[out.tag];
				out.time = stop._;
				return out; 
			});
			return out;
		});
		return out;
	});
}
var listCache = new Cache();
exports.list=function(cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	if(listCache.check('list',def)){
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
	}
	return def.promise;
}
var routeCache = new Cache();
exports.route=function(r,cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	if(routeCache.check(r,def)){
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
	}
	return def.promise;
}
var scheduleCache = new Cache();
exports.schedule=function(r,cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	if(scheduleCache.check(r,def)){
		request({
			url:busBase,
			qs:{
				command:"schedule",
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
						def.resolve(parseSched(result));
					}
				})
			}
		});
	}
	return def.promise;
}
var stopCache = new Cache();
exports.stop = function(stop,cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	if(stopCache.check(stop,def)){
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
	}
	return def.promise;
}
var subwayCache = new Cache();
exports.subway = function(line,cb){
	var def = q.defer();
	if(cb){
		def.promise.then(function(a){cb(null,a)},cb);
	}
	if(subwayCache.check(line,def)){
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
	}
	return def.promise;
}
var locationCache = new Cache();
exports.locations = function(route,since,cb){
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
	if(locationCache.check(route+since,def)){
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
	}
	return def.promise;
}
