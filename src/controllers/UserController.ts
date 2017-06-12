import { Router, Request, Response } from 'express'
import * as userDao from '../dao/UserDao'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  userDao.getAll().then((users) => {
    console.log('all users: ', users);
    res.status(200).send({ users });
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
      }).catch((err) => {
        console.log("err", err);
      })
    }
    else {
      res.boom.badRequest('Validation errors', result.mapped())
    }
  })
})

export default router