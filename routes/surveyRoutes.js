const _ = require('lodash')
const { Path } = require('path-parser')
const { URL } = require('url')
const mongoose = require('mongoose')
const requireLogin = require('../middlewares/requireLogin')
const requireCredits = require('../middlewares/requireCredits')
const Mailer = require('../services/Mailer')
const surveyTemplate = require('../services/emailTemplates/surveyTemplate')

const Survey = mongoose.model('surveys')
const User = mongoose.model('users')
const db = mongoose.connection;

module.exports = app => {
  // async because we are reaching into the database
  app.get('/api/surveys', requireLogin, async (req, res) => {
    const surveys = await Survey.find({ _user: req.user.id }).select({ recipients: false })
    res.send(surveys)
  })

  app.get('/api/surveys/thanks/:surveyId/:choice', (req, res) => {
    // res.redirect('/')
    res.send('Thanks for voting!')
  })

  app.post('/api/surveys/webhooks/', (req, res) => {
    const p = new Path('/api/surveys/:surveyId/:choice')
    _.chain(req.body)
      .map(({ email, url }) => {
        const match = p.test(new URL(url).pathname)
        if (match) {
          console.log('------------ WEBHOOK DATA -------------')
          console.log({ email, surveyId: match.surveyId, choice: match.choice })
          return { email, surveyId: match.surveyId, choice: match.choice }
        }
      })
      .compact()
      .uniqBy('email', 'surveyId')
      .each(({ surveyId, email, choice }) => {
        // Here we are finding the survey with the corresponding ID
        // and retrieve a recipient with the right email address and responded value with false
        // then in the second object we tell mongo to
        // increment the chosen response by one
        // and change the recipient.[index] responded value to true
        Survey.updateOne({
          _id: surveyId,
          recipients: {
            $elemMatch: { email: email, responded: false}
          }
        }, {
          $inc: { [choice]: 1 },
          $set: { 'recipients.$.responded': true},
          lastResponded: new Date()
        }).exec()
      })
      .value()
  })

  app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
    // the below translates to const title = req.body.title and so on
    const { title, subject, body, recipients } = req.body
    
    const survey = new Survey({
      // title: title (and so on)
      title,
      subject,
      body,
      recipients: recipients.split(',').map(email => ({ email: email.trim() })),
      _user: req.user.id,
      dateSent: Date.now()
    })

    const mailer = new Mailer(survey, surveyTemplate(survey))

    try {
      await mailer.send()
      await survey.save()
      req.user.credits -= 1
      const user = await req.user.save()
      res.send(user)
    } catch (err) {
      res.status(422).send(err)
    }
  })

  // This route was purely made just so I can check on surveys in development for testing. Can scrap.
  app.get('/api/surveys/find_something', (req, res) => {
    Survey.findById('5e3a5326b352af1cac8b91a0', function (err, data){
        res.send(data)
    })
  })
}