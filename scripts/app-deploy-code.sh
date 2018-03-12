build=builds/$(date "+%Y-%m-%d-%H%M%S").tar.gz
tar -s '|config/production.json|appconfig.json|' --exclude client/assets/ --exclude .DS_Store --exclude .eslintignore --exclude .eslintrc.json -czf $build server client package.json config/production.json
scp -i ~/.ssh/appserver.pem $build ec2-user@34.217.232.210:app.tar.gz
ssh -i ~/.ssh/appserver.pem ec2-user@34.217.232.210 "killall node; mv app/client/assets assets; rm -r app; mkdir app; tar -xzf app.tar.gz -C app; rm app.tar.gz; mv assets app/client/assets; cd app; npm install --production"