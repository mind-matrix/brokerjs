const expect = require('chai').expect;
const http = require('http');
const express = require('express');
const WebSocket = require('isomorphic-ws');
const Broker = require('../index');

var app, server, wss, wsc, brokerServer, brokerClient;

describe('Basic Initialization', function () {
    app = express();
    app.use(express.static('public'));

    server = http.createServer(app);

    wss = new WebSocket.Server({
        server
    });

    server.listen(8080);
});

describe('Subscription Services', function () {

    it('Broker Server Initialization', function(done) {
        brokerServer = new Broker({
            server: {
                message: ''
            },
            client: {
                message: ''
            }
        });
        wss.on('connection', (ws) => {
            var bws = brokerServer.subscribe(ws, 'server');
            bws.on('close', () => {
                brokerServer.unsubscribe(bws, 'server');
            });
        });
        done();
    });

    it('Broker Client Initialization', function(done) {
        brokerClient = new Broker({
            server: {
                message: ''
            },
            client: {
                message: ''
            }
        });
        wsc = new WebSocket(`ws://localhost:${server.address().port}`, {
            origin: `http://localhost:${server.address().port}`
        });
        wsc.onopen = () => {
            var bwsc = brokerClient.subscribe(wsc, 'client');
            bwsc.on('close', () => {
                brokerClient.unsubscribe(bwsc, 'client');
            });
            done();
        };
    });

    it('Broker Server/Client Reactivity', function (done) {
        this.timeout(3000); // increase mocha timeout for this test case
        brokerServer.models.server.message = 'hello world server';
        setTimeout(() => {
            expect(brokerClient.models.server.message).to.equal('hello world server');
            done();
        }, 2000);
    });

    it('Broker Client/Server Reactivity', function (done) {
        this.timeout(3000); // increase mocha timeout for this test case
        brokerClient.models.client.message = 'hello world client';
        setTimeout(() => {
            expect(brokerServer.models.client.message).to.equal('hello world client');
            done();
        }, 2000); // give 2 seconds for the message to be sent
    });
});

describe('Proper Termination', function () {
    it('Client Termination', function (done) {
        wsc.close();
        done();
    });
    it('Server Termination', function (done) {
        wss.close();
        done();
    });
});