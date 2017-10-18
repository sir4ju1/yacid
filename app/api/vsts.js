import { RestGen, route, auth } from 'microback'
import  vsts from 'vso-node-api'

const serverUrl = 'https://lolobyte.visualstudio.com/DefaultCollection'

const authHandler = vsts.getPersonalAccessTokenHandler('73bnibytkn2rfiffnavxk6b362quxim3jaxjaeffzyenczinihba')
const webApi = new vsts.WebApi(serverUrl, authHandler)


class VstsRest extends RestGen {
  constructor () {
    super('vsts')
  }
  @route('get', 'projects')
  async projects (ctx) {
    const core = webApi.getCoreApi()
    const projects = await core.getProjects()
    ctx.body = projects
  }
  @route('get', 'workitems/:project')
  async workitems (ctx) {
    const project = ctx.params.project
    const wit = webApi.getWorkItemTrackingApi()
    const wits = await wit.getReportingLinks(project)
    ctx.body = wits
  }
  @route('get', 'workitem/:id')
  async workitem (ctx) {
    const id = ctx.params.id
    const wit = webApi.getWorkItemTrackingApi()
    const wits = await wit.getWorkItem(id)
    ctx.body = wits
  }
  @route('get', 'iteration/:projectId')
  async iteration (ctx) {
    const projectId = ctx.params.projectId
    const wit = webApi.getWorkApi()
    const wits = await wit.getTeamIterations({ projectId })
    ctx.body = wits
  }
  @route('get', 'delivery/:projectId')
  async delivery (ctx) {
    const projectId = ctx.params.projectId
    const wit = webApi.getWorkApi()
    const wits = await wit.getBoards({ projectId })
    // const data = await wit.getPlan(projectId, wits[0].id)
    ctx.body = wit
  }
}

export default VstsRest
