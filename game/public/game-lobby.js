
const socket = io();

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

socket.on("usersUpdate", (users, error) => {
    if (error)
        return console.log("Error: " + error);

    const html = Mustache.render(sidebarTemplate, {
        users
    })
    document.querySelector('#sidebar').innerHTML = html
    let allUsers = document.querySelectorAll('li');

    for (let i = 0; i < allUsers.length; i++)
        allUsers[i].addEventListener("click", (info) => {
            const userName = info.target.innerText.split(' ')[0];
            socket.emit('sendReqToStartGameWith', userName, (error) => {
                if (error)
                    alert(error)
            })
        })
})

socket.on('error', (errorMsg) => {
    location.href = '/transferPage.html?msg=' + errorMsg
})

socket.on('ReqToStartGameWith', (fromUser) => {
    console.log("fromuser " + fromUser);
    alert(fromUser)
    if (fromUser) {
        const res = confirm('Hi! ' + fromUser.username + " is inviting u to play! his rank is " + fromUser.rank + ".")
        socket.emit('resToGameInvite', { fromUser, res })
    }
})

socket.on('reqCanceld', (userName) => {
    alert("Unfourtenly " + userName + " is decline your offer to play :(\nTry with another user :)")
})

let suka = 0
socket.on('startGame', ({ isWhite, names, id }) => {
    console.log("start game");

    suka++
    if (suka > 1)
        return

    let iframe = document.createElement('iframe');
    iframe.setAttribute('src', "http://localhost:3000/checkers/index.html");
    document.getElementById("gameDiv").appendChild(iframe)
    iframe.className = 'embeddedPage'

    let socketID = document.createElement("div")
    socketID.id = id
    socketID.className = "socketID"

    window.parent.document.getElementById('gameDiv').appendChild(socketID)

    iframe.onload = function () {  // before setting 'src'
        let page = document.getElementsByClassName("embeddedPage");
        let htmlDocument = page[0].contentWindow ? page[0].contentWindow.document : page[0].contentDocument //page.contentDocument || page.contentWindow.document//page.contentDocument;
        //htmlDocument.getElementsByClassName("black")

        // let socketID = htmlDocument.createElement("div")
        // socketID.id = id
        // socketID.className = "socketID"

        //htmlDocument.body.appendChild(socketID);
        // perent.appendChild(socketID);

        const nameTitle = htmlDocument.createElement('h3')
        nameTitle.innerText = names[0]
        nameTitle.style.textAlign = 'left'

        const nameTitle2 = htmlDocument.createElement('h3')
        nameTitle2.innerText = names[1]
        nameTitle2.style.textAlign = 'left'
        //afteer panel and game

        const panel = htmlDocument.getElementById("panel")
        const game = htmlDocument.getElementById("game")

        if (isWhite) {
            panel.after(nameTitle)
            game.prepend(nameTitle2)
        } else {
            panel.after(nameTitle2)
            game.prepend(nameTitle)
        }
    }
})

socket.emit('login', (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})





