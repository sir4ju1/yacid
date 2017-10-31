import { RestGen, route, auth } from 'microback'
import User from 'model/user'
class UserRest extends RestGen {
  constructor () {
    super('user', User)
  }
  @route('get', 'notify')
  async notify (ctx) {
    global.WsWorkItem.send('socket', 'send test')
    ctx.body = 'test ws'
  }
  @route('post', 'login')
  async login (ctx) {
    try {
      let body = ctx.request.body
      body.password = auth.generateHash(body.password)
      const token = await auth.login(body.email, body.password, User)
      ctx.body = { success: true, token }
    } catch (error) {
      ctx.body = { success: false, error }
    }
  }
}
export default UserRest
