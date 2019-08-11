const WebSocket = require('ws');
const http = require('http');
const Broker = require('../index');
const express = require('express');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);

const wss = new WebSocket.Server({
    server
});

var broker = new Broker({
    user: {
        tick: Date.now()
    },
    server: {
        sent: false,
        message: ''
    }
});
wss.on('connection', (ws) => {
    var bws = broker.subscribe(ws, 'user');
    bws.on("message", (message) => {
        bws.send("hello");
    });
    bws.on('close', () => {
        broker.unsubscribe(bws, 'user');
    });
});
setInterval(() => {
    broker.models.user.tick = Date.now();
    if(broker.models.server.sent)
        console.log(broker.models.server.message);
}, 1000);

server.listen(8080, () => {
    console.log(`Server running at port ${server.address().port}`);
});