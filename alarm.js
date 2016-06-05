var settings = require('./settings.json');
var Client = require('uptime-robot');
var cl = new Client(settings.API_KEY);
var rpio = require('rpio');


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

    this.PIN = parseInt(settings.PIN, 10);
    this.alarmDuration = settings.alarmDuration;

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
            this.alarm();
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
    console.log('Triggering alarm');
    rpio.close(this.PIN);
    rpio.open(this.PIN, rpio.OUTPUT, rpio.LOW);
    rpio.write(this.PIN, rpio.HIGH);
    rpio.sleep(this.alarmDuration);
    rpio.write(this.PIN, rpio.LOW);
    rpio.close(this.PIN);
  }
};

alarm.start();
