import { RestGen, route, auth } from 'microback'
import Vsts from 'logic/vsts'
import { VsoClient } from 'vso-node-api/VsoClient';


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
    try {
      const project = ctx.params.project
      const body = ctx.request.body
      switch(body.eventType) {
        case 'workitem.created':
          await Vsts.inserWit(project, body.resource)
        break
        case 'workitem.updated':
          await Vsts.updateWit(project, body.resource.revision)
        break
        default:
          await Vsts.getWorkitem(project)
        break
      }
      await Vsts.getWorkitem(project)
      global.WorkItem.send('socket', JSON.stringify({ type: 'wit', date: new Date() }))
      ctx.body = { success: true }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('get', ':project/hook')
  async serviceHook (ctx) {
    try {
      const data = await Vsts.createSubscription(ctx.params.project)
      ctx.body = { success: data }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('get', ':project/tests')
  async test (ctx) {
    try {
      const wits = await Vsts.test(ctx.params.project)
      ctx.body = { success: true, data: wits }
    } catch (error) {
      console.log(error)
      ctx.body = { success: false, error: error.message }
    }
  }
}


export default VstsRest
