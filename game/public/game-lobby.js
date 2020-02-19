
//<iframe style="width:200px;height:200px" src="you 2nd page url"></iframe>

//const { username, password } = Qs.parse(location.search, { ignoreQueryPrefix: true })
// const routers = require('../../database/routers')
//console.log(username + " " + password + "\n" + routers)

// const socket = io( {
//   extraHeaders: {
//     Authorization: "Bearer authorization_token_here"
//   }
// });


const socket = io();
// = {foo:"bar"}
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

socket.on("usersUpdate", (users, error) => {
    if (error)
        return console.log("Error: " + error);

    const html = Mustache.render(sidebarTemplate, {
        users
    })
    document.querySelector('#sidebar').innerHTML = html
    let allUsers = document.querySelectorAll('li');
    console.log(allUsers);
    for (let i = 0; i < allUsers.length; i++)
        allUsers[i].addEventListener("click", (info) => {
            console.log(info.target.innerText.split(' ')[0]);
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
    console.log("Client side from: " + JSON.stringify(fromUser));
    if (fromUser) {
        const res = confirm('Hi! ' + fromUser.username + " is inviting u to play! his rank is " + fromUser.rank + ".")
        socket.emit('resToGameInvite', { fromUser, res })
    }
})

socket.on('reqCanceld', (userName) => {
    alert("Unfourtenly " + userName + " is decline your offer to play :(\nTry with another user :)")
})

// function load_home(callback) {
//     return new Promise((resolve, reject) => {
//         document.getElementById("gameDiv").innerHTML = '<object type="text/html" data="http://localhost:3000/checkers/index.html"  class="gameDiv"></object>';
//         const tryAgain = () => {
//             if (document.getElementById("gameBoard")) {
//                 console.log("dd " + document.getElementById("gameBoard"));
//                 return resolve()
//             }
//             else
//                 tryAgain()
//         }
//         tryAgain()
//     })
//     //data="http://localhost:3000/checkers/index.html"
// }

let suka = 0
socket.on('startGame', ({ color, names, roomNumber }) => {
    suka++
    if (suka > 1)
        return
    //console.log("client: " + JSON.stringify(from) + "   " + JSON.stringify(to) + "   " + JSON.stringify(roomNumber));
    // document.getElementById("gameDiv").innerHTML = '<object id="embeddedPage" type="text/html" data="http://localhost:3000/checkers/index.html"  class="gameDiv"></object>';
    let ifrm = document.createElement('iframe');
    ifrm.setAttribute('src', "http://localhost:3000/checkers/index.html");
    document.getElementById("gameDiv").appendChild(ifrm)
    ifrm.className = 'embeddedPage'
    //document.getElementById("gameDiv").innerHTML = 

    setTimeout(() => {
        let page = document.getElementsByClassName("embeddedPage");
        let htmlDocument = page[0].contentWindow ? page[0].contentWindow.document : page[0].contentDocument //page.contentDocument || page.contentWindow.document//page.contentDocument;
        //htmlDocument.getElementsByClassName("black")
        const nameTitle = htmlDocument.createElement('h3')
        nameTitle.innerText = names[0]
        nameTitle.style.textAlign = 'left'

        const nameTitle2 = htmlDocument.createElement('h3')
        nameTitle2.innerText = names[1]
        nameTitle2.style.textAlign = 'left'
        //afteer panel and game

        const panel = htmlDocument.getElementById("panel")
        const game = htmlDocument.getElementById("game")

        if (color == "white") {
            panel.after(nameTitle)
            game.prepend(nameTitle2)
        } else {
            panel.after(nameTitle2)
            game.prepend(nameTitle)
        }
        //console.log(parentDiv);
        
 
        
        
        //console.log("dd " + JSON.stringify(htmlDocument)); //document.getElementById("gameBoard"));
    }, 1000);




    // // Begin test case [ 1 ] : Existing childElement (all works correctly)
    // let sp2 = document.getElementById("gameBoard")
    //parentDiv.insertBefore(newNode, sp2)

})

socket.emit('login', (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})





