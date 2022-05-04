#!/bin/bash
ip addr
npx sequelize db:migrate
npx sequelize db:seed:all