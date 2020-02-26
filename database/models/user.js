const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    rating: {
        type: Number,
        default: 100,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// userSchema.virtual('tasks', {
//     ref: 'Task',
//     localField: '_id',
//     foreignField: 'owner'
// })


userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    if (user.tokens.length > 4)
        user.tokens.shift();
    await user.save()

    return token
}

//win/loose is tenth of diff, draw is /25. min 1 point. max 25 points.
let tempRanks = new Map()
userSchema.method.updateRank = async (userToken, opponetToken, endGameState, isUserWhite) => {
    const user = await User.findOne({ 'tokens.token': token })
    const opponet = await User.findOne({ 'tokens.token': opponetToken })
    if (!tempRanks.get(token))
        tempRanks.set(token, new Date())
    if (!tempRanks.get(opponetToken))
        tempRanks.set(opponetToken, new Date())

    let userRank = tempRanks.get(userToken) && (new Date() - tempRanks.get(userToken)) < 15000 ?
        tempRanks.get(userToken) : user.rating
    let opponetRank = tempRanks.get(opponetToken) && (new Date() - tempRanks.get(opponetToken)) < 15000 ?
        tempRanks.get(opponetToken) : opponet.rating

    if (endGameState.draw) {
        user.rating = userRank + 3
        //opponet.rawListeners = opponetRank + 3
    }
    else {
        // let diff = userRank - opponetRank
        // let points = 0
        user.rating = user.rating + 10
        // if ((userRank - opponetRank > 0 && endGameState.isWhite == isUserWhite) ||
        //     () )
        //     points = (diff / 10 / Math.sqrt(diff))
        // else
        //     points = diff / 10

        // if (points > 25)
        //     points = 25
        // if (points < 1)
        //     points = 1
    }
}


userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({ name: username })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User