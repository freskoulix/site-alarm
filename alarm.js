var settings = require('./settings.json');
var Client = require('uptime-robot');
var cl = new Client(settings.API_KEY);
var Gpio = require('onoff').Gpio;


// Global variables
var STATUS_MAP = {
  0: 'PAUSED',
  1: 'NOT_CHECKED_YET',
  2: 'UP',
  8: 'SEEMS_DOWN',
  9: 'DOWN'
};


// alarm object
var alarm = {
  start: function () {
    console.log('Starting app');

    this.PIN = new Gpio(settings.PIN, 'out');
    this.PIN.writeSync(1);
    this.PIN_CLOSED = false;
    this.alarmDuration = settings.alarmDuration;

    this.eventListeners();

    this.check();
  },
  check: function () {
    var self = this;
    this.monitorID = parseInt(settings.monitorID, 10);
    console.log('Getting monitor data');
    this.getMonitors(function (data) {
      data.forEach(function (monitor) {
        if (monitor.id == self.monitorID) {
          console.log('Monitor:', monitor.id, 'status:', STATUS_MAP[monitor.status]);

          if (STATUS_MAP[monitor.status] == 'DOWN') {
            // Trigger alarm
            self.alarm();
          }
        }
      });
    });
  },
  getMonitors: function (callback) {
    console.log('Fetching available monitors');
    cl.getMonitors(function (error, data) {
      if (error !== null) {
        console.error('Error:', error);
        return;
      }

      console.log('Available monitors:', data.length);
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  },
  alarm: function () {
    var self = this;

    console.log('Triggering alarm');
    self.PIN.writeSync(0);
    setTimeout(function () {
      console.log('Terminating app');
      self.PIN.writeSync(1);
      self.PIN.unexport();
      self.PIN_CLOSED = true;
    }, self.alarmDuration * 1000);
  },
  eventListeners: function () {
    var self = this;

    function exitHandler(options, error) {
        if (options.cleanup && !self.PIN_CLOSED) {
          console.log('Terminating app');
          self.PIN.writeSync(1);
          self.PIN.unexport();
          self.PIN_CLOSED = true;
        }
        if (error)  {
          console.error(error.stack);
        }
        if (options.exit) {
          process.exit();
        }
    }

    process.on('exit', exitHandler.bind(null, {cleanup: true}));
    process.on('SIGINT', exitHandler.bind(null, {exit: true}));
    process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
  }
};

alarm.start();
