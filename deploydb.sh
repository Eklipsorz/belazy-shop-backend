#!/bin/bash
ifconfig -a
npx sequelize db:migrate
npx sequelize db:seed:all