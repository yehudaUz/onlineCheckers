const express = require('express')
const app = express();
const path = require('path')
const publicDirectoryPath = path.join(__dirname, '../game/public')
app.use(express.static(publicDirectoryPath))
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: true
}));
const port = process.env.PORT || 3000
const routers = require('./src/routers')

app.use(routers)

app.listen(port, () => {
    console.log('server start listening on port 3000!');
})
