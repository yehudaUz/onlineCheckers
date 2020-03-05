const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name,code) => {
    sgMail.send({
        to: email,
        from: 'mudale@onlineCheckers.com',
        subject: 'Confirmation code to CheckersOnline!',
        text: `Welcome to the game, ${name}. Your confirmation code is: ${code}.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mudale@onlineCheckers.com',
        subject: 'Piece brother',
        text: `Go with god.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}