# DEPRECATION NOTICE

This repository is no longer being maintained. Fitbit API data can be collected into Kafka using https://github.com/RADAR-base/RADAR-REST-connector. Fitbit users are registered with https://github.com/RADAR-base/RADAR-Rest-Source-Auth.

RADAR-REST-fitbit
=================

This application is designed to poll the Fitbit web API and post data to a Kafka topic.

This repository is intended to be configurable using a web API and by updating a local configuration on app start.

## Dependencies
- Node
- Kafka
- Zookeeper (for Kafka, this app does not depend on Zookeeper)

## Installation
1. Install latest version of node from https://nodejs.org
2. Clone this repository
3. Run `npm install`

## Configuration

All configuration can be updated by modifying configuration in the config folder / config.json file

```
{
	"host": "http://localhost", //updates the hosting location of this app
	"port": "3000", //updates the port of this app optional
	"fitbit": {
		"clientId": "YOUR FITBIT CLIENT ID",
		"clientSecret": "YOUR FITBIT CLIENT SECRET",
		"apiVersion": "1.2",
		"callbackRoute" :"/auth/fitbit/callback", //callback route for Fitbit
		"authRoute": "/auth/fitbit", //initial authorization 
		"dataAuthorized": "activity heartrate location nutrition profile settings sleep social weight", //data you wish to authorize for a specific Fitbit source
		"authorizationHTML": "Fitbit authorized!" //HTML shown on authorization screen
	},
	"poller":{
		"enabled":true, //starts polling on app launch
		"frequency": "3000", //frequency of polling
		"routesPolled": [ //determines which time series data to poll for
			{
				"resourcePath":"activities/steps", 
				"date":"today", 
				"period":"1d"
			}
		],
		"enableWebRoutes": true, //disables or enables access to web based polling control via web
		"stopPollingRoute":"/polling/stop", //route for stopping the poller
		"startPollingRoute":"/polling/start" //route for starting the poller
	},
	"kafka":{
		"host": "http://localhost:9092" //route for default Kafka instance
	},
	"sources":{
		"enableWebRoutes":true, //enable or disable visibility into source IDs and OAuth Tokens via web
		"deleteSourceRoute":"/sources/delete",
		"deactivateSourceRoute":"/sources/deactivate",
		"listAllSourcesRoute":"/sources/list"
	}
}
```

## Usage

### Adding a device
1. Ensure to update the Fitbit client secret, client id, and callback URLs
2. Start the app after installation by running `npm run start`
3. Add authorized devices by visiting the server auth URL, by default this is `https://localhost:3000/auth/fitbit` but this is configurable in the config.json file

### Stopping the poller
- Visit the server at `/polling/stop`

### Starting the poller
- Visit the server at `/polling/start`

### Getting a list of all devices
- Visit the server at `/sources/list`

### Deactivating a device
- Visit the server at `/sources/delete?user={ADD FITBIT ID HERE}`

### Deleting a device
- Visit the server at `/sources/deactivate?user={ADD FITBIT ID HERE}`
