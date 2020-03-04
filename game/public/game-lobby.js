
const socket = io();

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

socket.on("usersUpdate", (users, error) => {
    console.log(socket.id);
    console.log(JSON.stringify(users));

    if (error)
        return console.log("User update error: " + error);

    const html = Mustache.render(sidebarTemplate, {
        users
    })
    document.querySelector('#sidebar').innerHTML = html
    let allUsers = document.querySelectorAll('li');

    for (let i = 0; i < allUsers.length; i++)
        allUsers[i].addEventListener("click", (info) => {
            const userName = info.target.innerText.split(' ')[0];
            socket.emit('sendReqToStartGameWith', userName, (error) => {
                console.log("sendReqToStartGameWith  id: " + socket.id);

                if (error)
                    alert(error)
            })
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
    console.log("ReqToStartGameWith: " + JSON.stringify(fromUser));
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
    console.log(socket.id);

    alert("Unfortunately " + userName + " is decline your offer to play :(\nTry with another user :)")
})

let isUserColorblack
socket.on('startGame', ({ isBlack, names, id }) => {
    isUserColorblack = isBlack
    console.log("start game");
    console.log(socket.id);

    // suka++
    // if (suka > 1)
    //     return

    let iframe = document.createElement('iframe');
    // iframe.setAttribute('src', "https://quiet-shore-40615.herokuapp.com/checkers/index.html");
    iframe.setAttribute('src', "http://localhost:3000/checkers/index.html");
    document.getElementById("gameDiv").appendChild(iframe)
    iframe.className = 'embeddedPage'

    // let socketID = document.createElement("div")
    // socketID.id = id
    // socketID.className = "socketID"
    const userColor = document.createElement('div')


    window.parent.document.getElementById('gameDiv').appendChild(userColor)// socketID)

    iframe.onload = function () {  // before setting 'src'
        let page = document.getElementsByClassName("embeddedPage");
        let htmlDocument = page[0].contentWindow ? page[0].contentWindow.document : page[0].contentDocument //page.contentDocument || page.contentWindow.document//page.contentDocument;


        const nameTitle = htmlDocument.createElement('h3')
        nameTitle.innerText = names[0]
        nameTitle.style.textAlign = 'left'

        const nameTitle2 = htmlDocument.createElement('h3')
        nameTitle2.innerText = names[1]
        nameTitle2.style.textAlign = 'left'
        //afteer panel and game

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


