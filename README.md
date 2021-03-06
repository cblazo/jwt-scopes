# My Application

The project is generated by [LoopBack](http://loopback.io).

The API uses Auth0 as its authorization server.
Not connected to a database, but writes/reads file db.json

# Testing

- run npm install
- run node .
- get an access token (see the next section)
- make a HTTP request to http://localhost:3000/api/...

For demonstration purposes, there are 9 scopes and 3 registered applications.
They have been assigned the following scopes in Auth0:
- read:products (CustomerApp, EmployeeApp, ManagerApp)
- create:products (ManagerApp)
- update:products (EmployeeApp, ManagerApp)
- delete:products (ManagerApp)
- count:products
- read:sales (EmployeeApp, ManagerApp)
- update:sales (ManagerApp)
- create:sales (EmployeeApp, ManagerApp)
- delete:sales (ManagerApp)

## CustomerApp
Access token request:
curl --request POST \
  --url https://clazo.eu.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"MvIx0XO4CSgAIDAdhrzbGqdmI9Bec1Qu","client_secret":"C6Oj5Bqh97nff1gXIEqkX_MDy9xxo7Ck4h_pHbFI1p5Ki6TjChIMeLAfzIFa5dJs","audience":"https://your-apiendpoint.nl/","grant_type":"client_credentials"}'

## EmployeeApp
Access token request:
curl --request POST \
  --url https://clazo.eu.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"sdafiN30OEpmphhNrwbz7dkfy8iVekBu","client_secret":"wFLRfRLYBIYirkzaR5zjjr8beBgQbiDYXfK2_GP2at14HALGqZnD6Duzq6OQTGMy","audience":"https://your-apiendpoint.nl/","grant_type":"client_credentials"}'

## ManagerApp
Access token request:
curl --request POST \
  --url https://clazo.eu.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"MoBD0ShQuL5JtN7Avyuty9Ad9djhMB4H","client_secret":"co-XbACBrBT_3UsTalAHy55PpFQ27wI5thxM88v933YbdiXwbjDihTrjjccP_aJs","audience":"https://your-apiendpoint.nl/","grant_type":"client_credentials"}'
