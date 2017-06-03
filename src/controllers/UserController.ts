import { Router, Request, Response } from 'express'
import * as userDao from '../dao/UserDao'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  res.status(200).send({
    message: 'user controller is running!'
  })
})

router.post('/', (req: Request, res: Response) => {
  req.checkBody('email', 'Email is required').notEmpty()
  req.checkBody('email', 'A valid email is required').isEmail()

  req.getValidationResult().then((result) => {
    if (result.isEmpty()) {
      console.log('req.body', req.body)
      userDao.create(req.body).then((user) => {
        console.log('user', user)
        res.status(200).send({token: 'this is a token'})
      })
    }
    else {
      res.boom.badRequest('Validation errors', result.mapped())
    }
  })
})

export default router