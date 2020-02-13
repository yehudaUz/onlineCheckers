//const { username, password } = Qs.parse(location.search, { ignoreQueryPrefix: true })
// const routers = require('../../database/routers')
//console.log(username + " " + password + "\n" + routers)

// const socket = io( {
//   extraHeaders: {
//     Authorization: "Bearer authorization_token_here"
//   }
// });

const socket = io()
// = {foo:"bar"}
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

socket.on('usersUpdate', (users) => {
    // const users = [{ username: "mudale", rank: 100 }, { username: "suka", rank: 50 }]
     const html = Mustache.render(sidebarTemplate, {
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('login', (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})