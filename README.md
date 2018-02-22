# mail-tracker-server

1. A mail token(email identifier) is generated using the sender's email, receipient's email and subject of the email. (All this information could also be encrypted first locally)
2. This is attached as an URL in the image tag in email. 
3. So, when the email is opened, a 'GET' request is made to this URL, which is pointed to this server.
4. This server marks the email as read or increments the count of number of times the email was opened, using this token.
