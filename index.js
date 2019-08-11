const uniqid = require('uniqid');

class BrokeredConnection {
    constructor(connection, brokerCallback = () => {}) {
        this.id = uniqid();
        this.connection = connection;
        this.brokerCallback = brokerCallback;
        this.onopenCallbacks = [];
        this.onmessageCallbacks = [];
        this.oncloseCallbacks = [];
        this.connection.on('open', () => {
            for(var i=0; i < this.onopenCallbacks.length; i++)
                this.onopenCallbacks[i]();
        });
        this.connection.on('message', (message) => {
            var msg = JSON.parse(message);
            if(msg.t === 0)
                this.brokerCallback(msg.d);
            else {
                message = msg.d;
                for(var i=0; i < this.onmessageCallbacks.length; i++)
                    this.onmessageCallbacks[i](message);
            }
        });
        this.connection.on('close', () => {
            for(var i=0; i < this.oncloseCallbacks.length; i++)
                this.oncloseCallbacks[i]();
        });
    }
    on(event, callback) {
        if(event === 'open')
            this.onopenCallbacks.push(callback);
        else if(event === 'message')
            this.onmessageCallbacks.push(callback);
        else if(event === 'close')
            this.oncloseCallbacks.push(callback);
    }
    send(message) {
        this.connection.send(JSON.stringify({
            t: 1,
            d: message
        }));
    }
    sendBrokerMessage(data) {
        this.connection.send(JSON.stringify({
            t: 0,
            d: data
        }))
    }
}

module.exports = class Broker {
    constructor(models) {
        this.models = {};
        this.subscribers = {};
        for(var key in models) {
            this.subscribers[key] = [];
            var eventListener = (path, value) => {
                var obj = {};
                var ob = obj;
                for(var i=0; i < path.length - 1; i++) {
                    ob[path[i]] = {};
                    ob = ob[path[i]];
                }
                ob[path[path.length - 1]] = value;
                obj = Broker.removeHolders(JSON.parse(JSON.stringify(obj)));
                var key = path[0];
                if(this.subscribers.hasOwnProperty(key))
                    for(var subscriber of this.subscribers[key])
                        subscriber.sendBrokerMessage(obj);
            };
            Broker.createObserver(this.models, key, models[key], eventListener, [key]);
        }
    }
    static removeHolders(object) {
        for(var key in object) {
            var k = key.substr(1);
            if(typeof object[key] === 'object')
                object[key] = Broker.removeHolders(object[key]);
            if(key.startsWith('_') && object.hasOwnProperty(k)) {
                object[k] = object[key];
                delete object[key];
            }
        }
        return object;
    }
    static createObserver(variable, key, data, listener, pathway) {
        if(typeof data === 'object') {
            var xt = {};
            for(var k in data) {
                Broker.createObserver(xt, k, data[k], listener, pathway.concat(k));
            }
            data = xt;
        }
        
        variable['_' + key] = data;

        Object.defineProperty(variable, key, {
            enumerable: true,
            get: function () { return this['_' + key]; },
            set: function (x) {
                if(typeof x === 'object' && x !== null) {
                    var xt = {};
                    for(var k in x)
                        Broker.createObserver(xt, k, x[k], listener, pathway.concat(k));
                    this['_' + key] = xt;
                }
                else
                    this['_' + key] = x;
                listener(pathway, this['_' + key]);
            }
        });
    }
    set(data, model) {
        for(var key in data) {
            if(model.hasOwnProperty(key)) {
                if(typeof data[key] === 'object')
                    this.set(data[key], model[key]);
                else
                    model[key] = data[key];
            }
        }
    }
    subscribe(connection, modelName) {
        var brokered_connection = new BrokeredConnection(connection, (data) => {
            this.set(data, this.models);
        });
        this.subscribers[modelName].push(brokered_connection);
        return brokered_connection; //add broker callback later
    }
    unsubscribe(brokered_connection, modelName) {
        this.subscribers[modelName] = this.subscribers[modelName].filter((conn) => conn.id !== brokered_connection.id)
    }
}