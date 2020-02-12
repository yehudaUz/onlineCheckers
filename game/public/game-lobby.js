const { username, password } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const routers = require('../../database/routers')
console.log(username + " " + password +"\n" + routers)

