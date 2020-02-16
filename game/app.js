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

let usersOnline = []

const parseCookies = (str) => {
    // let output = [];
    let cookies = str.headers.cookie.split('; ')

    for (let i = 0; i < cookies.length; i++) {
        //    console.log(cookies[i]);

        if (/*cookies[i].includes('JudaAuthName') || cookies[i].includes('JudaAuthEmail') ||*/
            cookies[i].includes('JudaAuthToken')) {
            let name = cookies[i].split("=")[0];
            let val = cookies[i].split("=")[1];
            // output.push({ name, val })
            return val;
        }
    }
    return null;
    //return output;
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

        io.emit('usersUpdate', usersOnline)

        // io.emit('setGame',game)
        //console.log("options: " + JSON.stringify(options));

        //  console.log("LOGIN:\n" + socket.request.extraHeaders); ///socket.request.headers.cookie
        // for (let i = 0; i < socket.request.headers.length; i++)
        //     console.log(socket.request.headers[i])

        // const { error, user } = addUser({ id: socket.id, ...options })

        // if (error) {
        //     return callback(error)
        // }

        // socket.join(user.room)

        // socket.emit('message', generateMessage('Admin', 'Welcome!'))
        // socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        // io.to(user.room).emit('roomData', {
        //     room: user.room,
        //     users: getUsersInRoom(user.room)
        // })

        // callback()
    })

    socket.on('makeMove', ({ from, to }) => {
        console.log("From: " + JSON.stringify(from) + "           TO: " + JSON.stringify(to));

    })

    socket.on('reqToStartGameWith', (userName) => {
        const from =  usersOnline.find(oneUser => oneUser.socketId == socket.id).username
        console.log("Server side from: " + from);
        console.log("Server side to: " + userName);

    }, "some error occured")
    // socket.on('sendMessage', (message, callback) => {
    //     const user = getUser(socket.id)
    //     const filter = new Filter()

    //     if (filter.isProfane(message)) {
    //         return callback('Profanity is not allowed!')
    //     }

    //     io.to(user.room).emit('message', generateMessage(user.username, message))
    //     callback()
    // })

    // socket.on('sendLocation', (coords, callback) => {
    //     const user = getUser(socket.id)
    //     io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    //     callback()
    // })

    socket.on('disconnect', () => {
        //     const user = removeUser(socket.id)

        //     if (user) {
        //         io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
        //         io.to(user.room).emit('roomData', {
        //             room: user.room,
        //             users: getUsersInRoom(user.room)
        //         })
        //     }
    })
})

server.listen(port, () => {
    console.log('server start listening on port 3000!');
})
