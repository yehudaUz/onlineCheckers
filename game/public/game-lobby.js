
const socket = io();

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

socket.on("usersUpdate", ({ users, userName }) => {
    const html = Mustache.render(sidebarTemplate, {
        users
    })
    document.querySelector('#sidebar').innerHTML = html
    let allUsers = document.querySelectorAll('li');

    for (let i = 0; i < allUsers.length; i++) {
        allUsers[i].addEventListener("click", (info) => {
            const userName = info.target.innerText.split(' ')[0];
            socket.emit('sendReqToStartGameWith', userName, (error) => {
                if (error)
                    alert(error)
            })
        })
    }
    allUsers.forEach(u => {
        console.log((u));
        if (u.firstElementChild.innerText.split(' ')[0] == userName)
            u.firstElementChild.id = "userName"
    })
})

socket.on('error', (errorMsg) => {
    location.href = '/transferPage.html?msg=' + errorMsg
})
socket.on('err', (errorMsg) => {
    location.href = '/transferPage.html?msg=' + errorMsg
})

socket.on('msg', (msg) => {
    alert(msg)
})

socket.on('ReqToStartGameWith', (fromUser, isPlayerVsHimself) => {
    if (isPlayerVsHimself) {
        const res = confirm('Hi! Are u sure u want to play against yourself??? your rank will not be upadted. ')
        socket.emit('resToGameInvite', { fromUser, res })
    }
    else if (fromUser) {
        const res = confirm('Hi! ' + fromUser.username + " is inviting u to play! his rank is " + fromUser.rank + ".")
        socket.emit('resToGameInvite', { fromUser, res })
    }
})

socket.on('reqCanceld', (userName) => {
    alert("Unfortunately " + userName + " is decline your offer to play :(\nTry with another user :)")
})

let isUserColorblack
socket.on('startGame', ({ isBlack, names, id }) => {
    isUserColorblack = isBlack

    let iframe = document.createElement('iframe');
    iframe.setAttribute('src', "https://quiet-shore-40615.herokuapp.com/checkers/index.html");
    // iframe.setAttribute('src', "http://localhost:3000/checkers/index.html");
    document.getElementById("gameDiv").appendChild(iframe)
    iframe.className = 'embeddedPage'

    const userColor = document.createElement('div')
    window.parent.document.getElementById('gameDiv').appendChild(userColor)// socketID)

    iframe.onload = function () {
        let page = document.getElementsByClassName("embeddedPage");
        let htmlDocument = page[0].contentWindow ? page[0].contentWindow.document : page[0].contentDocument

        const nameTitle = htmlDocument.createElement('h3')
        nameTitle.innerText = names[0]
        nameTitle.style.textAlign = 'left'

        const nameTitle2 = htmlDocument.createElement('h3')
        nameTitle2.innerText = names[1]
        nameTitle2.style.textAlign = 'left'

        const panel = htmlDocument.getElementById("panel")
        const game = htmlDocument.getElementById("game")

        if (!isBlack) {
            panel.after(nameTitle)
            game.prepend(nameTitle2)
            userColor.id = "userColorWhite"
        } else {
            userColor.id = "userColorBlack"
            panel.after(nameTitle2)
            game.prepend(nameTitle)
        }
    }
})

function removeIframe() {
    document.querySelector('iframe').parentNode.removeChild(document.querySelector('iframe'));
    login()
}

const login = () => {
    socket.emit('login', () => {
    })
}

login()


