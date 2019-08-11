const WebSocket = require('isomorphic-ws');
const Broker = require('../../index');

var model = {
    serverTime: Date.now(),
    message: ''
};

var broker = new Broker(model);

var ws = new WebSocket('ws://localhost:8080');

var bws = broker.createFrom(ws);

document.getElementById('send').addEventListener('click', (e) => {
    var message = document.getElementById('message').value;
    if(message.trim() !== '') {
        bws.send(message);
    }
});

setInterval(() => {
    if(broker.models.message.trim() !== '')
        document.getElementById('messageDisplay').textContent = broker.models.message;
});