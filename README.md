# brokerjs
A reactive solution to passing data between WebSocket Server and Client using Data Models.
## Installation
Using npm
```cmd
npm install @mindmatrix/brokerjs
```
I am working on a Vanilla JS distribution but for now you can use Webpack for the client-side. See example in *demo* folder.

## Running Tests
Make sure all dependencies are resolved and that mocha and chai are installed.
```cmd
npm test
```
There are currently only 10 test cases. I will add more test cases soon.

## Demonstration

To run the simple demonstration, make sure you have webpack along with all the other dependencies installed and then from the project root
```cmd
cd demo
node server
```
Then open the URL (http://localhost:8080) in your favourite web browser.

**Note:** The demonstration uses `setInterval` to update DOM Elements whenever the model data changes. In your applications, you might want to use some reactive framework like VueJS in conjunction with BrokerJS for binding the model data to the DOM. In future, I might as well add support for direct DOM rendering.

## Usage

To use BrokerJS you require either the `ws` library or a variant of it like `isomorphic-ws`. First require the dependencies into your application.
```js
const WebSocket = require('ws');
const Broker = require('brokerjs');
```

Create a WebSocket Server. You can use HTTP, HTTPS, Express and any other framework, or just a plain WebSocket Server. For simplicity we will keep to the plain server.

```js
const wss = new WebSocket.Server({ port: 8080 });
```

Next create the data model and the broker instance.
```js
var models = {
    property1: 'value',
    property2: 'another-value',
    property3: {
        nested_property: 'something-else'
    },
    // ... and so on
};
var broker = new Broker(models);
```

After a new client joins, we need to upgrade the websocket connection to a brokered websocket connection.
```js
wss.on('connection', function(ws) {
    var bws = broker.createFrom(ws);
});
```

Next we subscribe the client connection to specific model updates (one or many). Here we subscribe the client to `property1` and `property2` so that whenever `property1` or `property2` or both change(s), the client is notified of the change.

```js
wss.on('connection', function(ws) {
    var bws = broker.createFrom(ws);
    broker.subscribe(bws, 'property1');
    broker.subscribe(bws, 'property2');
});
```

The subscription and upgradation can also be done in one step. All subsequent subscriptions should, however, be on the brokered connection. For example the above code can be simplified into:

```js
wss.on('connection', function(ws) {
    var bws = broker.subscribe(ws, 'property1');
    broker.subscribe(bws, 'property2');
});
```

On the other side, all you need to do is create a similar brokered connection from a websocket with the same (or similar) model, essentially having the keys `property1` and `property2` in it. For example:

```js
var models = {
    property1: 'value',
    property2: 'another-value',
    property4: 'a different property',
    // ... and so on
};
var broker = new Broker(models);
```

So long as the subscribed keys are present in models of both the brokers, data will be shared reactively between the two.

To access any value of the model at any instant of time:

```js
console.log(broker.models.myprop); // prints value of `myprop` key at that instant
```

**Note:** As a friendly reminder, you probably do not want to listen to any key that you are writing to on either side. For example, this should not be what you intend to do:

*Server*

```js
var models = {
    prop: 'val'
};
var broker = new Broker(models);
wss.on('connection', function(ws) {
    var bws = broker.subscribe(ws, 'prop');
});
```

*Client*

```js
var models = {
    prop: 'val'
};
var broker = new Broker(models);
var ws = new WebSocket('ws://localhost:8080');
var bws = broker.createFrom(ws);
/*
 ... your code
*/
broker.models.prop = 'val'; //not what you wanna do
```

The brokered connection can still accept and send normal messages too! Just like a normal WebSocket connection.
```js
wss.on('connection', function(ws) {
    var bws = broker.subscribe(ws, 'prop');
    bws.on('message', function (message) {
        console.log(message);
        bws.send("OK, got it!");
    });
});
```

As an added benefit, BrokerJS allows you to send messages *and* receive replies in callbacks.

```js
bws.send("Hi", (reply) => {
    console.log(reply); // prints `Hello` to console
});
```

```js
bws.on('message', (message, e) => {
    console.log(message); // prints `Hi` to console
    bws.reply(e, "Hello");
});
```

Finally, it is a good practice to unsubscribe the connection when it is closed. This reduces a little overhead of saving unusable connection information. Just a little house cleaning.

```js
wss.on('connection', function(ws) {
    var bws = broker.subscribe(ws, 'prop');
    bws.on('close', function () {
        broker.unsubscribe(bws, 'prop');
    });
});
```

# License

Copyright (c) 2019 [Sagnik Modak](https://github.com/mind-matrix)

This content is released under [MIT License](https://opensource.org/licenses/MIT)