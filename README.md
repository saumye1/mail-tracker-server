# mail-tracker-server

1. A mail token(email identifier) is generated using the sender's email, receipient's email and subject of the email. (All this information could also be encrypted first locally)
2. This is attached as an URL in the image tag in email. 
3. So, when the email is opened, a 'GET' request is made to this URL, which is pointed to this server.
4. This server marks the email as read or increments the count of number of times the email was opened, using this token.

## How to setup your own mail tracker server?(It can be your localhost)

1. Clone this repo on your server.
2. Go to the directory:
    
        cd mail-tracker-server

3. Install all packages:
    
        npm install

4. Install pm2 node manager:
    
        npm install pm2 -g

5. Then specify your server config and start the app.js file:
    
        NODE_ENV=live pm2 start app.js --name mail-tracker && pm2 logs mail-tracker

P.S: You need to have mongodb installed on your server and the service should be started for the node to connect to it.