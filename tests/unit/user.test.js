import test from 'ava'
import User from 'model/user'

test('create user', async t => {
  const user = await User.create({ email: 'admin@email.com', password: '1' })
  t.is('admin@email.com', user.email)
})
