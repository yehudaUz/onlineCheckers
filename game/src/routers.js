const express = require('express')
const path = require('path')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../../database/models/user')
const auth = require('../../database/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../../emails/account')
const router = new express.Router()
require('../../database/mongoose')
// const { username, password } = Qs.parse(location.search, { ignoreQueryPrefix: true })
// const routers = require('../../database/routers')
// console.log(username + " " + password +"\n" + routers)

// app.use(function (req, res) {
//     if ((req.path.indexOf('html') >= 0)) {
//         res.redirect('/login');
//     } 
// });


router.post('/signup', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        //sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})


router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.username, req.body.password)
        const token = await user.generateAuthToken()
        console.log("token: " + token + "\nUser: " + user);
        res.cookie('JudaAuthName', user.name)
        res.cookie('JudaAuthEmail', user.email)
        res.cookie('JudaAuthToken', token)
        res.redirect("game-lobby.html")
    } catch (e) {
        res.status(400).redirect('./loginError.html')
    }
})

// router.get('/game-lobby', async (req, res) => {
//     console.log(11111111111);

//   res.redirect('/login');
// })

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

router.get('*', async (req, res) => {
    // console.log(1111111111111111111111);

    return res.redirect('/')
})

router.get(/html$/, async (req, res) => {
    // console.log("Adasfasgfasgfewsg");

    res.redirect('/')
})


module.exports = router