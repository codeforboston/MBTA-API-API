var request = require("request");
var q = require('q');
var parser = (new require('xml2js').Parser()).parseString;
var busBase = "http://webservices.nextbus.com/service/publicXMLFeed"
var RTA = require('rta');
var subways = {
	red:"http://developer.mbta.com/lib/rthr/red.json",
	orange:"http://developer.mbta.com/lib/rthr/orange.json",
	blue:"http://developer.mbta.com/lib/rthr/blue.json"
};
var mbta = new RTA('mbta',10);
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


var subwayCache = new Cache();
mbta.subway = function(line,cb){
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
module.exports=mbta;
