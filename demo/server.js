const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const Broker = require('../index');
const webpack = require('webpack');
const webpackconfig = require('./webpack.config.js');

const compiler = webpack(webpackconfig);
compiler.run((err, stats) => {
  if(err) console.error(err);
  else {
      console.log("Webpack Bundling Done.");
      const app = express();
      app.use(express.static('public'));
      
      const server = http.createServer(app);
      
      const wss = new WebSocket.Server({
          server
      });
      
      var model = {
          serverTime: Date.now(),
          message: ''
      };
      
      const broker = new Broker(model);
      
      wss.on('connection', (ws) => {
          var bws = broker.subscribe(ws, 'serverTime');
          broker.subscribe(bws, 'message');
          bws.on('message', (message) => {
              broker.models.message = message;
          });
          bws.on('close', () => {
              broker.unsubscribe(bws, 'serverTime');
              broker.unsubscribe(bws, 'message');
          });
      });
      
      server.listen(8080, () => {
          console.log(`Server running at http://localhost:${server.address().port}/`);
      });
  }
});