const mongoose = require('mongoose')
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})