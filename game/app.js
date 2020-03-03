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
// io.eio.pingTimeout = 1200000; // 2 minutes
// io.eio.pingInterval = 50000;

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

io.on('connection', async (socket) => {
    console.log('New WebSocket connection')

    socket.use(async function (packet, next) {
        const token = parseCookies(socket.handshake);
        const user = await User.findOne({ 'tokens.token': token })
        if (!user) {
            console.log("error authonitcate")
            socket.emit('err', 'Authontication failure!!')
            socket.disconnect(true)
            //io.sockets.disconnect();
            //io.sockets.close();
            next()
        }

        socket.token = token//setting socket token and sockets property and room
        if (usersOnline[token] && !usersOnline[token].sockets.includes(socket.id)) {
            usersOnline[token].sockets.push(socket.id)
            socket.join(usersOnline[token].room, () => { //join updated socket id to game
                console.log("UP Id: " + socket.id + "Rooms: " + JSON.stringify(socket.rooms))
                next()
            })
        } else
            next()
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
            if (value.sockets.includes(opponenetSocketId)) {
                return value.token
            }
        }
    }
    socket.on('getEndGameState', (isOpponentMove, callback) => {
        const room = usersOnline[socket.token].room
        const endGameState = checkersLogic.getEndGameState(room) //{ win: true, isWhite: true, isDraw: false }
        if (endGameState.win || endGameState.isDraw) {
            if (!isOpponentMove) {
                io.of('/').in(room).clients((err, idsRes) => {
                    if (idsRes.length > 2) {    //player against himself not getting ranks
                        const user = usersOnline[socket.token]
                        const oppToken = room.user1 //rooms.find(room => room.roomNumber == room).user1
                        User.updateRank(socket.token, oppToken, endGameState, user.isWhite).then((res, rej) => {
                            usersOnline[socket.token].rank = res.userRating
                            usersOnline[oppToken].rank = res.opponentRating
                        })
                    }
                });
            }
            socket.leave(room, () => { })
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
        const legalMoveState = checkersLogic.isMoveTotalLegal(from, to, room, usersOnline[socket.token])
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
        let request = reqControl.get(socket.token)
        if (request && request.to == to.token && (new Date() - request.time) / 1000 > 30)//30 sec pass
            reqControl.delete(request)

        if (request && request.to == to.token) {//request sent or in game with player
            io.of('/').in(usersOnline[socket.token].room).clients((err, idsRes) => {
                if (idsRes) {
                    if (!idsRes.includes(socket.id))
                        return socket.emit('msg', userName + " didn't respond (yet) to your offer..\nPlease wait patiencely or choose another player.");
                    else
                        return socket.emit('msg', "You r in the game with this player....");
                }
            })
        }
        else if (typeof usersOnline[socket.token].room !== "undefined") {//if (Object.keys(socket.rooms).length > 1) {//socket itself in the middle of game
            socket.emit('msg', 'You r in the middle of game.. please leave first!')
        }
        else if (typeof to.room !== "undefined") { //the target socket in the middle of game
            socket.emit('msg', 'Unfortunately ' + userName + " is in the middle of game.. please wait until he is done.")
        }
        else {//send req to start new game            
            const fromUser = { username: usersOnline[socket.token].username, rank: usersOnline[socket.token].rank }

            if (to.sockets.includes(socket.id)) //player vs himself
                io.to(usersOnline[socket.token].sockets[0]).emit("ReqToStartGameWith", fromUser, true)
            else {
                to.sockets.forEach(suka => io.to(suka).emit("ReqToStartGameWith", fromUser, false));
                //reqControl.set(socket.token, { time: new Date(), to: to.token }) //add to request control avoid users annoy
            }
        }
    })

    socket.on('resToGameInvite', ({ fromUser, res }) => {
        let from = findInUsersOnlineByName(fromUser.username)
        const to = usersOnline[socket.token]

        if (res) {
            from.room = roomNumber, to.room = roomNumber
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

            if (res.length >= 2)
                checkersLogic.setNewRoom(usersOnline[socket.token].room, board)
            else
                checkersLogic.setNewRoom(usersOnline[socket.token].room, board, true)
        })
    })



    const handleSocketLeaveOrDisconnect = (socket) => {
        console.log("socket " + socket.id + " disconnected.")
        if (!usersOnline[socket.token])
            return

        const room = usersOnline[socket.token].room;
        if (usersOnline[socket.token].sockets.includes(socket.id))
            if (usersOnline[socket.token].sockets.indexOf(socket.id) > -1)
                usersOnline[socket.token].sockets.splice(usersOnline[socket.token].sockets.indexOf(5), 1);


        io.of('/').in(room).clients((err, idsRes) => {

            idsRes.forEach(id => {
                let socketInRoom = io.sockets.connected[id]
                console.log("remove socket: " + id + "   from room: " + room);
                // reqControl.forEach(request => {
                //     if (request.to == getTokenBySocketId(id))
                //         reqControl.delete(request)
                // })
                // if (reqControl.get(getTokenBySocketId(id)))
                //     reqControl.delete(getTokenBySocketId(id))
                if (socketInRoom.token == socket.token) {
                    // usersOnline[socket.token].room = undefined
                    // socketInRoom.room = undefined
                    socketInRoom.leave(room)
                }
            })

            const endGameState = checkersLogic.updateLeaveRoom(usersOnline[socket.token], room)
            idsRes.forEach(id => {
                if (endGameState)
                    io.to(id).emit('endGameUpdate', endGameState)
            })

            if (usersOnline[socket.token] && usersOnline[socket.token].sockets.length == 0) {
                delete usersOnline[socket.token]
                io.emit('usersUpdate', getPublicUserData())
            }
        })
    }

    socket.on('offerDraw', (callback) => {
        const room = usersOnline[socket.token].room;
        io.of('/').in(room).clients((err, idsRes) => {
            if (idsRes != null)
                idsRes.forEach(id => {
                    if (usersOnline[socket.token].sockets.includes(id))
                        return //continue next foreach element
                    io.to(id).emit('opponentAsk4Draw')
                })
        })
    })

    socket.on('resign', (callback) => {
        const room = usersOnline[socket.token].room;
        const endGameState = checkersLogic.resignGame(usersOnline[socket.token], room)
        let sent = []
        io.of('/').in(room).clients((err, idsRes) => {
            idsRes.forEach(id => {
                let send = true
                sent.forEach(sentId => {
                    Object.values(usersOnline).forEach(user => {
                        if (user.sockets.includes(sentId))
                            send = false
                    })
                })
                if (send) {
                    io.to(id).emit('endGameUpdate', endGameState)
                    sent.push(id)
                }
            })
            callback(endGameState)
        })
    })

    socket.on('resToDraw', (res) => {
        const room = usersOnline[socket.token].room;
        const endGameState = checkersLogic.updateResToDraw(room, res)
        let sent = []
        io.of('/').in(room).clients((err, idsRes) => {
            idsRes.forEach(id => {
                let send = true
                sent.forEach(sentId => {
                    Object.values(usersOnline).forEach(user => {
                        if (user.sockets.includes(sentId) && user.sockets.includes(id)) {///////////////////////not working && !user.sockets[0] == id) {
                            send = false
                            console.log("Block: " + id);
                        }
                    })
                })

                if (send) {
                    io.to(id).emit('opponentDrawRes', endGameState)
                    console.log("Send: " + id);

                    sent.push(id)
                }
            })
        })
    })

    socket.on('leaveGame', (callback) => {
        const room = usersOnline[socket.token].room;
        handleSocketLeaveOrDisconnect(socket)
        callback()
    })

    socket.on('disconnect', () => {
        handleSocketLeaveOrDisconnect(socket)
    })
})

server.listen(port, () => {
    console.log('server start listening on port 3000!');
})
