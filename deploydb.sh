#!/bin/bash
dig +short myip.opendns.com @resolver1.opendns.com
npx sequelize db:migrate
npx sequelize db:seed:all