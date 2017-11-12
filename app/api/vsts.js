import { RestGen, route, auth } from 'microback'
import Vsts from 'logic/vsts'


class VstsRest extends RestGen {
  constructor () {
    super('vsts')
  }
  @route('get', 'projects/import')
  async projects (ctx) {
    try {
      const projects = await Vsts.getAllProjects()
      ctx.body = { success: true }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('get', 'project/:project/import')
  async projectImport (ctx) {
    try {
      const project = ctx.params.project
      await Vsts.getProject(project)
      ctx.body = { success: true }
  
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('get', ':project/workitems')
  async workitems (ctx) {
   try {
    const project = ctx.params.project
    const wits = await Vsts.getWorkitem(project)
    ctx.body = { success: true }
   } catch (error) {
     ctx.body = { success: false, error: error.message }
   }
  }
  @route('patch', 'wit/state')
  async witState (ctx) {
    try {
      const body = ctx.request.body
      await Vsts.changeStatus(body)
      ctx.body = { success: true }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('post', ':project/notification')
  async witNotification (ctx) {
    const project = ctx.params.project
    await Vsts.getWorkitem(project)
    global.WorkItem.send('socket', JSON.stringify({ type: 'wit', date: new Date() }))
    ctx.body = { success: true }
  }
}


export default VstsRest
