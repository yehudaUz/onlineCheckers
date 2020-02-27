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
    if ((req.path.indexOf('html') >= 0)) {
        return res.redirect('/');
    }
    next()
});


const server = http.createServer(app)
const io = socketio(server)
io.eio.pingTimeout = 1200000; // 2 minutes
io.eio.pingInterval = 50000;

const bearerToken = require('express-bearer-token');

const User = require('../database/models/user')

const Checkers = require('./src/checkers/CheckersLogic.js')
const BoardManagement = require('./src/checkers/BoardManagement.js')

let checkersLogic = new Checkers()
let boardManagement = new BoardManagement()

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

let keys = function (object) {
    if (!(object && typeof object === 'object')) {
        return null;
    }
    var result = [];
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            result.push(key)
        }
    }
    return result;
}

io.on('connection', async (socket) => {
    console.log('New WebSocket connection')

    socket.use(async function (packet, next) {
        const token = parseCookies(socket.handshake);
        const user = await User.findOne({ 'tokens.token': token })
        if (!user) {
            console.log("error authonitcate")
            socket.emit('error', 'Authontication failure!!')
            io.sockets.disconnect();
            io.sockets.close();
            next()
        }
        if (!socket.onlineUser && usersOnline.find(oneUser => oneUser.token == token)) {
            socket.onlineUser = usersOnline.find(oneUser => oneUser.token == token)
            if (keys(socket.rooms)[0] != socket.id) {
                socket.roomKeys = keys(socket.rooms)
                // next()
            }
            //else
            // socket.leave(socket.id, () => {
            // next()
            // })
        }
        if (socket.onlineUser && socket.onlineUser.socketId != socket.id && io.sockets.connected[socket.onlineUser.socketId]) { //remove else double req start game
            io.sockets.connected[socket.onlineUser.socketId].leave(socket.onlineUser.room, () => {//remove old socet id from room
                socket.onlineUser.socketId = socket.id  //update user id in onlineUsers
                socket.join(socket.onlineUser.room, () => { //join updated socket id to game
                    console.log("UP Id: " + socket.id + "Rooms: " + JSON.stringify(socket.rooms))
                    if (keys(socket.rooms)[0] != socket.id) {
                        socket.roomKeys = keys(socket.rooms)
                        next()
                    }
                    // else
                    //next()
                })
            });
        }
        else
            next()
    })

    socket.on('login', async () => {
        const token = parseCookies(socket.handshake);
        const user = await User.findOne({ 'tokens.token': token })

        if (user) {
            const userData = { username: user.name, rank: user.rating, socketId: socket.id, games: [/*{room:,color:}*/], token }
            if (!usersOnline.find(oneUser => oneUser.username == userData.username))
                usersOnline.push(userData)
        }

        io.emit('usersUpdate', usersOnline)
    })

    socket.on('getEndGameState', (isOpponentMove, callback) => {
        const endGameState = { win: true, isWhite: true, isDraw: false }
        if (endGameState.win || endGameState.isDraw) {
            if (!isOpponentMove) {
                io.of('/').in(socket.onlineUser.room).clients((err, idsRes) => {
                    if (idsRes.length > 1) {    //player against himself not getting ranks
                        const user = usersOnline.find(oneUser => oneUser.socketId == socket.id)
                        const opponenetSocketId = (socket.id != idsRes[0]) ? idsRes[0] : idsRes[1]
                        User.updateRank(parseCookies(socket.handshake), parseCookies((io.sockets.connected[opponenetSocketId]).handshake),
                            endGameState, user.isWhite).then((res, rej) => {
                                usersOnline[usersOnline.findIndex(oneUser => oneUser.socketId == socket.id)].rank = res.userRating
                                usersOnline[usersOnline.findIndex(oneUser => oneUser.socketId == opponenetSocketId)].rank = res.opponentRating
                            })
                    }
                });
            }
            socket.leave(socket.room, () => { })
            socket.onlineUser = null, socket.roomKeys = null
            io.emit('usersUpdate', usersOnline)
            callback(endGameState)
        } else
            callback(endGameState)
    })

    socket.on('isMoveTotalLegal', ({ from, to }, callback) => {
        const legalMoveState = checkersLogic.isMoveTotalLegal(from, to, socket.roomKeys[0], socket.onlineUser)
        if (legalMoveState.is) {

            boardManagement.makeMove(from, to, legalMoveState, checkersLogic.getBoardByIndex(socket.roomKeys[0]));

            checkersLogic.checkAndUpadateMiddleSequenceState(legalMoveState, to, socket.roomKeys[0])

            if (!legalMoveState.inMiddleSequence.is)
                boardManagement.updateKingsIfNecessary(to, checkersLogic.getBoardByIndex(socket.roomKeys[0]));

            socket.broadcast.to(socket.roomKeys[0]).emit('opponentMove', { from, to, legalMoveState })
            io.of('/').in(socket.roomKeys[0]).clients((err, res) => {

                console.log(socket.id + " Send to other people in in room: " + socket.roomKeys[0] + "\n" +
                    "Peolple in room: " + res);
            })

        }
        callback(legalMoveState)
    })

    let reqControl = new Map()
    socket.on('sendReqToStartGameWith', (userName) => {
        //const from = usersOnline.find(oneUser => oneUser.socketId == socket.id)
        const to = usersOnline.find(oneUser => oneUser.username == userName);
        // if (reqControl.get(to.socketId)) {
        //     if ((reqControl.get(to.socketId) - new Date()) / 1000 > -15)
        //         return
        // }
        // else
        //     reqControl.set(to.socketId, new Date())
        // if (!reqControl.get(to.socketId)) {
        //     reqControl.set(to.socketId, new Date())
        //     return
        // }


        console.log("sendReqToStartGameWith id:" + socket.id + " to: " + to.socketId + " userName: " + userName);
        console.log("request controel: " + JSON.stringify(reqControl))
        io.to(to.socketId).emit("ReqToStartGameWith", { username: socket.onlineUser.username, rank: socket.onlineUser.rank })
    })

    socket.on('resToGameInvite', ({ fromUser, res }) => {
        const from = usersOnline.find(oneUser => oneUser.username == fromUser.username)
        const to = usersOnline.find(oneUser => oneUser.socketId == socket.id)

        if (res) {
            // socket.leave(socket.id);
            // io.sockets.connected[from.socketId].leave(from.socketId)
            socket.join(roomNumber, () => {
                to.room = roomNumber
                io.sockets.connected[from.socketId].join(roomNumber, () => {
                    from.room = roomNumber
                    io.to(from.socketId).emit('startGame', { isWhite: true, names: [from.username, to.username], id: from.socketId })
                    from.isWhite = true
                    if (from.socketId != to.socketId) { //for 1 player against himself
                        io.to(to.socketId).emit('startGame', { isWhite: false, names: [to.username, from.username], id: to.socketId })
                        to.isWhite = false
                    }
                    console.log("Id1: " + socket.id + "Rooms: " + JSON.stringify(socket.rooms))
                    console.log("Id2: " + from.socketId + "Rooms: " + JSON.stringify(io.sockets.connected[from.socketId].rooms))
                    roomNumber++;
                })
            })
        }
        else {
            io.to(from.socketId).emit('reqCanceld', to.username)
        }
    })

    socket.on('gameConfigured', ({ id, board }) => {
        checkersLogic.setNewRoom(socket.onlineUser.room, board)

        io.of('/').in(socket.onlineUser.room).clients((err, res) => {
            console.log("set new game, people in room: " + JSON.stringify(res));

            if (res.length == 2) {
                // io.to(socket.onlineUser.room).emit("pleaseCheckConnection")
                checkersLogic.setNewRoom(socket.onlineUser.room, board)
            }
            else {
                checkersLogic.setNewRoom(socket.onlineUser.room, board, true)
                console.log("only 1 in room!!!!!!!");

            }

        })
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

    // socket.on('checkConnection', () => {
    //     console.log(socket.id + "  checked connection.");
    // })
})



server.listen(port, () => {
    console.log('server start listening on port 3000!');
})
