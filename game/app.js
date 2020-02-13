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

const parseCookies = (str) => {
    let output = [];
    let cookies = str.headers.cookie.split('; ')

    for (let i = 0; i < cookies.length; i++) {
        console.log(cookies[i]);

        if (cookies[i].includes('JudaAuthName') || cookies[i].includes('JudaAuthToken') ||
            cookies[i].includes('JudaAuthEmail')) {
            let name = cookies[i].split("=")[0];
            let val = cookies[i].split("=")[1];
            output.push({ name, val })
        }
    }
    return output;
}


io.use(function (socket, next) {
    console.log("qqqqqqqqqqqqqq");

    let handshakeData = socket.handshake;
    console.log("handshakeData: " + JSON.stringify(handshakeData) + "\n\n")
    console.log(parseCookies(handshakeData))
    // make sure the handshake data looks good as before
    // if error do this:
    // next(new Error('not authorized'));
    // else just call next
    next();
});

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('login', (options, callback) => {
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

    // socket.on('disconnect', () => {
    //     const user = removeUser(socket.id)

    //     if (user) {
    //         io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
    //         io.to(user.room).emit('roomData', {
    //             room: user.room,
    //             users: getUsersInRoom(user.room)
    //         })
    //     }
    // })
})

server.listen(port, () => {
    console.log('server start listening on port 3000!');
})
