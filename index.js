io = require('socket.io-client');
Adapter = require('adapterjs');
Skylink = require('skylinkjs');

skylink = new Skyway();

//skylink.setLogLevel(skylink.LOG_LEVEL.DEBUG);

skylink.on('peerJoined', function(peerId, peerInfo, isSelf) {
  if(!isSelf) {
    console.log('peerJoined');
  }
});

var DEFAULT_APPKEY = null;
var DEFAULT_ROOM = null;

var WebRTCSyncMixin = {
  componentWillMount: function() {
    this.updatingViaWebRTC = false;
  },

  componentDidMount: function() {
    this._webRTCComponentId = window.btoa(this._rootNodeID + ',' + this._mountDepth);
    skylink.on('incomingMessage', this.handleSkylinkMessage);
  },

  componentWillUnmount: function() {
    skylink.off('incomingMessage', this.handleSkylinkMessage);
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (this.updatingViaWebRTC) {
      return;
    }
    var update = {};
    for (var k in this.state) {
      if (prevState[k] !== this.state[k]) {
        update[k] = this.state[k];
      }
    }

    skylink.sendP2PMessage({
      componentId: this._webRTCComponentId,
      update: update
    });
  },

  handleSkylinkMessageDone: function() {
    this.updatingViaWebRTC = false;
  },

  handleSkylinkMessage: function(message, peerId, peerInfo, isSelf) {
    if(!isSelf) {
      var msg = message.content;

      if(msg.componentId === this._webRTCComponentId) {
        this.updatingViaWebRTC = true;

        // TODO: can we remove this double reconcile?
        this.replaceState(msg.update, this.handleSkylinkMessageDone);
      }
    }
  }
};

module.exports = {
  Mixin: WebRTCSyncMixin,
  initSkylink: function(key, room) {
    DEFAULT_APPKEY = key;
    DEFAULT_ROOM = room || '';

    skylink.init(DEFAULT_APPKEY, function() {
      skylink.joinRoom(DEFAULT_ROOM);
    });
  }
};
