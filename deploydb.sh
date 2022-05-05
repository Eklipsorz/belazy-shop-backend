#!/bin/bash
host myip.opendns.com resolver1.opendns.com | grep "myip.opendns.com has" | awk '{print $4}'
npx sequelize db:migrate
npx sequelize db:seed:all