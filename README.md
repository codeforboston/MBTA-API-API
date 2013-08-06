MBTA API API
===

MBTA data, for those who don't care for XML. Test version running at `mbta.calvinmetcalf.com`
try [bus.calvinmetcalf.com/list](http://bus.calvinmetcalf.com/list)

Install with:
```
npm install mbta
```

commands

```javascript
mbta.locations(route[,since,cb]);
	->geojson from the bus GPS
mbta.subway(line[,cb]);
	->returns the MBTA json
mbta.stop(stop[,cb]);
	->predictions for a stop
mbta.list([cb]);
	->list of route IDs
mbta.route(route[,cb]);
	->information about a route
mbta.schedule(route[,cb]);
	-> schedule of the route.
```

It returns a promise so you can omit the callback if your into that. Also included is 'server.js' which can be run with `node server.js` and is a simple api endpoint setup with CORS and JSONP enabled.

Not affiliated with the MBTA or MassDOT. Inspired by [Tom MacWright](https://github.com/tmcw)'s [wmataapiapi](https://github.com/tmcw/wmataapiapi).
