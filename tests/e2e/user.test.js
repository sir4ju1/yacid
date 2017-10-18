import test from 'ava'
import { agent } from 'supertest'
import app from '~/index'
import User from 'model/user'
const request = agent(app.listen())
var token = ''
test.before('get token', async (t) => {
  // await User.create({ email: 'admin@email.com', password: '123456' })
  const res = await request
    .post('/api/user/login')
    .send({ email: 'admin@email.com', password: '123456' })
  token = res.body.token
})
test('create user', async (t) => {
  var res = await request
    .post('/api/user')
    .set('Authorization', `Bearer ${token}`)
    .send({ email: 'user@email.com', password: '123456' })
  // t.is(true, res.body.success)
  t.is(200, res.status)
})
test.after('delete user', async (t) => {
  await User.deleteOne({ email: 'user@email.com' })
})
