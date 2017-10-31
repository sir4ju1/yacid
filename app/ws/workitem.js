import { WsGen, ws, wsends } from 'microback'
export default class WorkItem extends WsGen {
  @ws('socket')
  async find (ctx) {
    var self = this
    ctx.websocket.on('message', m => {
      console.log(m)
    })
  }
}
