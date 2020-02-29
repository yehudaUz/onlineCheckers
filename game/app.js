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

let reqControl = new Map()
let usersOnline = []
let rooms = []
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
            socket.emit('err', 'Authontication failure!!')
            io.sockets.disconnect();
            io.sockets.close();
            next()
        }

        socket.token = token
        if (usersOnline[token] && !usersOnline[token].sockets.includes(socket.id)) {
            usersOnline[token].sockets.push(socket.id)
            socket.join(usersOnline[token].room, () => { //join updated socket id to game
                console.log("UP Id: " + socket.id + "Rooms: " + JSON.stringify(socket.rooms))
                next()
            })
        } else
            next()

        // if (Object.keys(usersOnline).length > 0) {
        //     // if (!socket.onlineUser)
        //     //     socket.onlineUser = usersOnline[token]
        //            // if (keys(socket.rooms)[0] != socket.id)
        //         //     socket.roomKeys = keys(socket.rooms)
        //     }
        // }



        // if (!socket.onlineUser && usersOnline[token]) {
        //     socket.onlineUser = usersOnline[token]
        //     if (keys(socket.rooms)[0] != socket.id) {
        //         socket.roomKeys = keys(socket.rooms)
        //         // next()
        //     }
        //else
        // socket.leave(socket.id, () => {
        // next()
        //     })
        // }
        // if (socket.onlineUser && socket.onlineUser.socketId != socket.id && io.sockets.connected[socket.onlineUser.socketId]) { //remove else double req start game
        //     io.sockets.connected[socket.onlineUser.socketId].leave(socket.onlineUser.room, () => {//remove old socet id from room
        //         let request = reqControl.get(socket.onlineUser.socketId)//update reqControl ket to ne socket.id
        //         if (request) {
        //             reqControl.set(socket.token, request)
        //             if (reqControl.get(socket.token).to == socket.onlineUser.socketId)
        //                 reqControl.get(socket.token).to = socket.token
        //             reqControl.delete(socket.onlineUser.socketId)
        //         }
        //         socket.onlineUser.socketId = socket.id  //update user id in onlineUsers
        //         socket.join(socket.onlineUser.room, () => { //join updated socket id to game
        //             console.log("UP Id: " + socket.id + "Rooms: " + JSON.stringify(socket.rooms))
        //             if (keys(socket.rooms)[0] != socket.id)
        //                 socket.roomKeys = keys(socket.rooms)
        //             next()
        //         })
        //     });
        // }
        // else
        //     next()
    })



    const getPublicUserData = () => {
        let publicUsersData = []
        for (const [key, value] of Object.entries(usersOnline)) {
            publicUsersData.push({ username: value.username, rank: value.rank })
        }
        return publicUsersData
    }
    socket.on('login', async () => {
        const token = parseCookies(socket.handshake);
        const user = await User.findOne({ 'tokens.token': token })

        if (user) {
            const userData = {
                username: user.name, rank: user.rating, sockets: [socket.id], token,
                room: undefined, isWhite: undefined
            }
            const userIn = findInUsersOnlineByName(user.name)
            if (userIn)
                delete usersOnline[userIn.token]
            usersOnline[token] = userData

            io.emit('usersUpdate', getPublicUserData())
        }
    })

    const getTokenBySocketId = (opponenetSocketId) => {
        for (const [key, value] of Object.entries(usersOnline)) {
            if (value.socketId == opponenetSocketId) {
                return value
            }
        }
    }
    socket.on('getEndGameState', (isOpponentMove, callback) => {
        const endGameState = { win: true, isWhite: true, isDraw: false }
        if (endGameState.win || endGameState.isDraw) {
            if (!isOpponentMove) {
                io.of('/').in(usersOnline[socket.token].room).clients((err, idsRes) => {
                    if (idsRes.length > 2) {    //player against himself not getting ranks
                        const user = usersOnline[socket.token]
                        const oppToken = rooms.find(room => room.roomNumber == usersOnline[socket.token].room).user1
                        //const opponenetSocketId = (socket.id != idsRes[0]) ? idsRes[0] : idsRes[1]
                        User.updateRank(socket.token, oppToken, endGameState, user.isWhite).then((res, rej) => {
                                usersOnline[socket.token].rank = res.userRating
                                usersOnline[oppToken].rank = res.opponentRating
                            })
                    }
                });
            }
            socket.leave(socket.room, () => { })
            // socket.onlineUser = null, socket.roomKeys = null
            //            reqControl.set(socket.id, { time: new Date(), to: to.socketId })
            if (reqControl.get(socket.token))
                reqControl.delete(socket.token)
            io.emit('usersUpdate', getPublicUserData())
            callback(endGameState)
        } else
            callback(endGameState)
    })

    socket.on('isMoveTotalLegal', ({ from, to }, callback) => {
        console.log(usersOnline);
        const room = usersOnline[socket.token].room;
        const legalMoveState = checkersLogic.isMoveTotalLegal(from, to, room, usersOnline[socket.token])/////////////////////////////////
        if (legalMoveState.is) {

            boardManagement.makeMove(from, to, legalMoveState, checkersLogic.getBoardByIndex(room));

            checkersLogic.checkAndUpadateMiddleSequenceState(legalMoveState, to, room)

            if (!legalMoveState.inMiddleSequence.is)
                boardManagement.updateKingsIfNecessary(to, checkersLogic.getBoardByIndex(room));

            socket.broadcast.to(room).emit('opponentMove', { from, to, legalMoveState })
            io.of('/').in(room).clients((err, res) => {

                console.log(socket.id + " Send to other people in in room: " + room + "\n" +
                    "Peolple in room: " + res);
            })

        }
        callback(legalMoveState)
    })

    const findInUsersOnlineByName = (name) => {
        for (const [key, value] of Object.entries(usersOnline)) {
            if (value.username == name) {
                return value
            }
        }
    }
    socket.on('sendReqToStartGameWith', (userName) => {
        let to = findInUsersOnlineByName(userName);

        if (reqControl.get(socket.token) && reqControl.get(socket.token).to == to.token) {
            io.of('/').in(usersOnline[socket.token].room).clients((err, idsRes) => {
                if (idsRes) {
                    if (!idsRes.includes(socket.id))
                        return socket.emit('msg', userName + " didn't respond (yet) to your offer..\nPlease wait patiencely or choose another player.");
                    else
                        return socket.emit('msg', "You r in the game with this player....");
                }
            })
        }
        else {
            reqControl.set(socket.token, { time: new Date(), to: to.token })
            console.log("sendReqToStartGameWith id:" + socket.id + " to: 1)" + to.sockets[0] + " 2) " + to.sockets[1] + "  userName: " + userName);
            console.log("request control: " + JSON.stringify(reqControl))
            const fromUser = { username: usersOnline[socket.token].username, rank: usersOnline[socket.token].rank }

            if (to.sockets.includes(socket.id))
                io.to(usersOnline[socket.token].sockets[0]).emit("ReqToStartGameWith", fromUser, true)
            else
                to.sockets.forEach(suka => io.to(suka).emit("ReqToStartGameWith", fromUser, false));
        }
    })

    socket.on('resToGameInvite', ({ fromUser, res }) => {
        let from = findInUsersOnlineByName(fromUser.username)
        const to = usersOnline[socket.token]
        from.room = roomNumber, to.room = roomNumber

        if (res) {
            rooms.push({ roomNumber, user1: socket.token, user2: from.token })
            from.sockets.forEach(suka => { io.sockets.connected[suka].join(roomNumber) })
            from.sockets.forEach(suka2 => io.to(suka2).emit('startGame', { isWhite: true, names: [from.username, to.username], id: suka2 }))
            from.isWhite = true
            to.sockets.forEach(suka3 => {
                if (!from.sockets.includes(suka3)) { //for 1 player against himself
                    io.to(suka3).emit('startGame', { isWhite: false, names: [to.username, from.username], id: suka3 })
                    to.isWhite = false
                }
            })
            roomNumber++;
        }
        else
            from.sockets.forEach(suka4 => io.to(suka4).emit('reqCanceld', to.username))
    })


    socket.on('gameConfigured', ({ board }) => {
        checkersLogic.setNewRoom(usersOnline[socket.token].room, board)

        io.of('/').in(usersOnline[socket.token].room).clients((err, res) => {
            console.log("set new game, people in room: " + JSON.stringify(res));

            if (res.length == 2) {
                // io.to(socket.onlineUser.room).emit("pleaseCheckConnection")
                checkersLogic.setNewRoom(usersOnline[socket.token].room, board)
            }
            else {
                checkersLogic.setNewRoom(usersOnline[socket.token].room, board, true)
                console.log("only 1 in room!!!!!!!");

            }

        })
    })

    socket.on('disconnect', () => {
        console.log("socket " + socket.id + " disconnected.")
        if (!usersOnline[socket.token])
            return
        const room = usersOnline[socket.token].room;
        // if (usersOnline[socket.token]) {
        //     delete usersOnline[socket.token]
        //     io.emit('usersUpdate', usersOnline)
        // }
        // if (socket.onlineUser)
        io.of('/').in(room).clients((err, idsRes) => {
            if (idsRes.length <= 1) {
                const opponenetSocketId = idsRes[0]
                const opponenetSocketId2 = idsRes[1]
                console.log("send left to id1: " + idsRes[0] + "   id2: " + idsRes[1]);

                io.to(opponenetSocketId).emit('opponentLeft')
                io.to(opponenetSocketId2).emit('opponentLeft')

                //socket.leave(socket.room, () => { })
                // if (socket.onlineUser)
                //     socket.onlineUser = null
                // if (socket.roomKeys)
                //     socket.roomKeys = null
                if (usersOnline[socket.token]) {
                    delete usersOnline[socket.token]
                    io.emit('usersUpdate', getPublicUserData())
                }
            }
        })
    })
})



server.listen(port, () => {
    console.log('server start listening on port 3000!');
})
