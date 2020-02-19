console.clear()
const express = require('express')
const app = express();
var cookieParser = require('cookie-parser');
const http = require('http')
const socketio = require('socket.io')
const path = require('path')
const publicDirectoryPath = path.join(__dirname, '../game/public')
app.use(express.static(publicDirectoryPath))
app.use(cookieParser());
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: true
}));
const port = process.env.PORT || 3000
const routers = require('./src/routers')
app.use(routers)
app.use(function (req, res, next) {
    //console.log(req.path);
    if ((req.path.indexOf('html') >= 0)) {
        // console.log("ffffffffffffffffffffffffff");

        return res.redirect('/');
    }
    next()
});


const server = http.createServer(app)
const io = socketio(server)

const bearerToken = require('express-bearer-token');

const User = require('../database/models/user')

const Checkers = require('./src/checkers/CheckersLogic.js')
const BoardManagement = require('./public/checkers/BoardManagement')

let checkersLogic = new Checkers()
//let boardManagement = new BoardManagement()
//console.log(JSON.stringify(checkersLogic));


let usersOnline = []
let roomNumber = 0;

const parseCookies = (str) => {
    let cookies = str.headers.cookie.split('; ')

    for (let i = 0; i < cookies.length; i++) {
        if (cookies[i].includes('JudaAuthToken')) {
            let name = cookies[i].split("=")[0];
            let val = cookies[i].split("=")[1];
            return val;
        }
    }
    return null;
}


io.use(async function (socket, next) {
    const token = parseCookies(socket.handshake);
    console.log("Token: " + token)
    const user = await User.findOne({ 'tokens.token': token })

    if (!user) {
        console.log("error authonitcate")
        socket.emit('error', 'Authontication failure!!')
        io.sockets.disconnect();
        io.sockets.close();
    }

    next();
});

io.on('connection', async (socket) => {
    console.log('New WebSocket connection')

    socket.on('login', async () => {
        const token = parseCookies(socket.handshake);
        const user = await User.findOne({ 'tokens.token': token })

        if (user) {
            const userData = { username: user.name, rank: user.rating, socketId: socket.id }
            if (!usersOnline.find(oneUser => oneUser.username == userData.username))
                usersOnline.push(userData)
        }

        console.log("Us: " + JSON.stringify(usersOnline));

        io.emit('usersUpdate', usersOnline)
    })

    socket.on('makeMove', ({ from, to }, callback) => {
        console.log("From: " + JSON.stringify(from) + "           TO: " + JSON.stringify(to));
        callback()
    })

    socket.on('getEndGameState', (callback) => {
        // console.log(JSON.stringify(checkersLogic))
        console.log("socket.rooms[0]: " +JSON.stringify(socket.rooms[0]));
        
        const endGameState = checkersLogic.getEndGameState(socket.rooms[0])

            //socket.id)
        callback(endGameState)
    })

    socket.on('sendReqToStartGameWith', (userName) => {
        const from = usersOnline.find(oneUser => oneUser.socketId == socket.id)
        console.log("Server side from: " + from);
        console.log("Server side to: " + userName);
        const to = usersOnline.find(oneUser => oneUser.username == userName);

        io.to(to.socketId).emit('ReqToStartGameWith', { username: from.username, rank: from.rank })
    })

    socket.on('resToGameInvite', ({ fromUser, res }) => {
        console.log("REs " + res);
        const from = usersOnline.find(oneUser => oneUser.username == fromUser.username)
        const to = usersOnline.find(oneUser => oneUser.socketId == socket.id)

        if (res) {
            socket.join(roomNumber)
            io.sockets.connected[from.socketId].join(roomNumber);
            io.to(from.socketId).emit('startGame', { color: "white", names: [from.username, to.username] })
            io.to(to.socketId).emit('startGame', { color: "black", names: [to.username, from.username] })
            JSON.stringify(socket.rooms[0])
            //checkersLogic.setNewRoom(roomNumber, new BoardManagement().setSymbolicBoard())
            // io.to(roomNumber).emit('startGame', {
            //     "white",
            //     to,
            //     roomNumber,
            // })
            roomNumber++;
        }
        else {
            io.to(from.socketId).emit('reqCanceld', to.username)
        }
    })

    socket.on('gameConfigured', (board) => {
        checkersLogic.setNewRoom(roomNumber, board)
    })

    socket.on('disconnect', (callback) => {
        const userLeftIndex = usersOnline.findIndex((oneUser) => {
            return oneUser.socketId == socket.id
        })
        if (userLeftIndex > -1) {
            usersOnline.splice(userLeftIndex, 1)
            io.emit('usersUpdate', usersOnline)

        }

    })
})

server.listen(port, () => {
    console.log('server start listening on port 3000!');
})
