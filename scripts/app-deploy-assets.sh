build=builds/$(date "+%Y-%m-%d-%H%M%S").tar.gz
tar --exclude .DS_Store -czf $build client/assets
scp -i ~/.ssh/appserver.pem $build ec2-user@34.217.232.210:assets.tar.gz
ssh -i ~/.ssh/appserver.pem ec2-user@34.217.232.210 "rm -r app/client/assets; tar -xzf assets.tar.gz -C app; rm assets.tar.gz"