ssh -i ~/.ssh/appserver.pem ec2-user@34.217.232.210 "killall node; cd app; nohup npm start > logs/out.txt 2> logs/err.txt &"
