// const { username, password } = Qs.parse(location.search, { ignoreQueryPrefix: true })
// const routers = require('../../database/routers')
// console.log(username + " " + password + "\n" + routers)
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

///socket.on('roomData', ({ room, users }) => {
const room = "User name       Rank"
const users = [{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },
{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 },
 { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 }
,{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 }
,{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 },{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 }]
const html = Mustache.render(sidebarTemplate, {
    room,
    users
})
document.querySelector('#sidebar').innerHTML = html
//})
