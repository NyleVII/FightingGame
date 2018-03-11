build=builds/$(date "+%Y-%m-%d-%H%M%S").tar.gz
tar -czf $build server client package.json
scp -i ~/.ssh/appserver.pem $build ec2-user@34.217.232.210:app.tar.gz
ssh -i ~/.ssh/appserver.pem ec2-user@34.217.232.210 "sudo killall node; sudo rm -r app; mkdir app; tar -xzf app.tar.gz -C app; rm app.tar.gz; cd app; npm install --production"