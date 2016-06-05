#!/bin/bash

NODE_PROCESS=$(ps -aux| grep node| grep alarm.js)

if [[ -z ${NODE_PROCESS} ]]; then
  echo "Starting process"
  node alarm.js
else
  echo "Process already running"
fi
