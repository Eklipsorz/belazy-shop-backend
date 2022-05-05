#!/bin/bash
npm install --global public-ip-cli
public-ip
npx sequelize db:migrate
npx sequelize db:seed:all