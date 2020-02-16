//<iframe style="width:200px;height:200px" src="you 2nd page url"></iframe>

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
    const html = Mustache.render(sidebarTemplate, {
        users
    })
    document.querySelector('#sidebar').innerHTML = html
    let allUsers = document.querySelectorAll('li');
    console.log(allUsers);
    for (let i = 0; i < allUsers.length; i++)
        allUsers[i].addEventListener("click", (info) => {
            console.log(info.toElement.innerText.split(' ')[0]);
            const userName = info.toElement.innerText.split(' ')[0];
            socket.emit('reqToStartGameWith', userName, (error) => {
                if (error)
                    alert(error)
            })
        })
})

socket.on('error', (errorMsg) => {
    location.href = '/transferPage.html?msg=' + errorMsg
})

socket.emit('login', (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

function load_home() {
    document.getElementById("gameDiv").innerHTML = '<object type="text/html" data="http://localhost:3000/checkers/index.html" class="gameDiv"></object>';
}

load_home()