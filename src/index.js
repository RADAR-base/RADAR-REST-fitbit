const argv = require('minimist')(process.argv.slice(2)),
	fs = require('fs'),
	kafka = require('kafka-node'),
	Datastore = require('nedb'),
	AsyncPolling = require('async-polling'),
	FitbitApiClient = require('fitbit-node'),
	express = require("express");

var config = JSON.parse(fs.readFileSync("config/config.json"));

const app = express();
const fitbitClient = new FitbitApiClient(config.fitbit);
const hostname = config.host + ((config.port != "") ? ":" + config.port : "");

var db = {};
db.sources = new Datastore({ filename: 'data/sources.db', autoload: true });

var pushKafkaMessage = function(data){
	console.log(data);
	// KafkaProducer.on('ready', function () {
	//     KafkaProducer.send(data, function (err, data) {
	//         DISCUSS WITH RADAR TEAM
	//     });
	// });

	// KafkaProducer.on('error', function (err) {
	// DISCUSS WITH RADAR TEAM
	// });
}

var fetchAndPushDataForAllRoutes = function(source, routes){

	console.log(source);
	for (var i = 0; i < routes.length; i++){
	
		fitbitClient.get(routes[i], source.accessToken).then(results => {
			pushKafkaMessage(results);
		}).catch(err => {
			console.log(err.errors);
		})
	}

}

var availableFitbitRouteTypeFormatters = function(routeDefinition){
	var types = {};

	types.standard = function(routeDefinition){

		return "/"+ routeDefinition.resourcePath + ".json"

	}

	types.activities_time_series = function(routeDefinition){

		return "/1/user/" + "-" + "/" + routeDefinition.resourcePath + "/date/" + routeDefinition.date + "/" + routeDefinition.period + ".json";
	}

	return types[routeDefinition.type](routeDefinition)
} 

var updateSourceTokenOnRefresh = function(result){
	var updatedSource = {user:result.user_id, accessToken: result.access_token, refreshToken: result.refresh_token, tokenExpiresAt: result.expires_at,tokenUpdatedAt: new Date()};

	db.sources.update({ user: result.user_id }, { $set: updatedSource }, {},function (err, numReplaced, upsert) {
		});

	return updatedSource
}

var poller = function(){
	db.sources.find({ activePoll: true }, function (err, docs) {
		var activeSources = docs;
	  	for (i = 0; i < activeSources.length; i++) { 
		  	fitbitClient.refreshAccessToken(activeSources[i].accessToken,activeSources[i].refreshToken).then(result =>{
		  		fetchAndPushDataForAllRoutes(updateSourceTokenOnRefresh(result),config.poller.routesPolled);
		  	}).catch(err =>{console.log(err)});
		}
	});
}

// FitBit Auth
app.get(config.fitbit.authRoute, (req, res) => {
	res.redirect(fitbitClient.getAuthorizeUrl(config.fitbit.dataAuthorized, hostname + config.fitbit.callbackRoute));
});

// FitBit Callback
app.get(config.fitbit.callbackRoute, (req, res) => {
	fitbitClient.getAccessToken(req.query.code, hostname + config.fitbit.callbackRoute).then(result => {
		var accessToken = result.access_token,
			refreshToken = result.refresh_token;
		console.log(result);
		fitbitClient.get("/profile.json", result.access_token).then(results => {
			res.send("FITBIT ACCOUNT AUTHORIZED");
			db.sources.update({ user: results[0].user.encodedId }, { user: results[0].user.encodedId, authCode: req.query.code, accessToken: accessToken, refreshToken: refreshToken, activePoll: true, tokenUpdatedAt: new Date()}, {upsert:true},function (err, numReplaced, upsert) {
			});
		}).catch(err => {
			res.status(err.status).send(err);
		});
	}).catch(err => {
		res.status(err.status).send(err);
	});
});

if (config.poller.enableWebRoutes){
	// Stop polling 
	app.get(config.poller.stopPollingRoute, (req, res) => {
		config.poller.enabled = false;
		res.send("Polling Stopped");
	});

	// Start polling 
	app.get(config.poller.startPollingRoute, (req, res) => {
		config.poller.enabled = true;
		res.send("Polling Started");
	});
}


if (config.sources.enableWebRoutes){
	// List sources
	app.get(config.sources.listAllSourcesRoute, (req, res) => {
		db.sources.find({ activePoll: true }, function (err, sources) {
			res.send(sources);
		});
	});
	// Delete source
	app.get(config.sources.deleteSourceRoute, (req, res) => {
		db.remove({ user: req.query.user }, function (err, numRemoved) {
			res.send("User " + req.query.user + " Removed");
		});
	});
	// Deactivate source
	app.get(config.sources.deactivateSourceRoute, (req, res) => {
		db.sources.find({ user: req.query.user }, function (err, sources) {
			db.sources.update({ user: req.query.user }, { $set: { activePoll: false }}, {});
			res.send("User " + req.query.user + " Deactivaterd");
		});
	});
}

app.listen(config.port);

AsyncPolling(function (end) {
    if (config.poller.enabled){
    	poller();
    };
    end();
}, config.poller.frequency).run();