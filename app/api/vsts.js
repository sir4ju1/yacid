import { RestGen, route, auth } from 'microback'
import  vsts from 'vso-node-api'
import Project from 'model/project'
import Repo from 'model/repo'
import Iteration from 'model/iteration'
import Team from 'model/team'
import WorkItem from 'model/workitem'
import { config } from 'dotenv'
config()

const serverUrl = `https://${process.env.TFSNAME}.visualstudio.com/DefaultCollection`

const authHandler = vsts.getPersonalAccessTokenHandler(process.env.ACCESSTOKEN)
const webApi = new vsts.WebApi(serverUrl, authHandler)


class VstsRest extends RestGen {
  constructor () {
    super('vsts')
  }
  @route('get', 'projects/import')
  async projects (ctx) {
    const core = webApi.getCoreApi()
    const projects = await core.getProjects()
    const wit = webApi.getWorkApi()
    const gitApi = webApi.getGitApi()
    
    let options = { upsert: true, new: true, setDefaultsOnInsert: true }
    for (let i = 0; i < projects.length; i++) {
      let p = projects[i]
      const project = await Project.findOneAndUpdate({ tfs_id: p.id }, {
        tfs_id: p.id,
        name: p.name,
        tfs_name: p.name,
        description: p.desciption,
        repos: [],
        iterations: [],
        members: []
      }, options)
    }
    ctx.body = { success: true }
  }
  @route('get', 'project/:project/import')
  async projects (ctx) {
    try {
      const core = webApi.getCoreApi()
      const p = await core.getProject(ctx.params.project)
      const wit = webApi.getWorkApi()
      const gitApi = webApi.getGitApi()
      
      let options = { upsert: true, new: true, setDefaultsOnInsert: true }
      const project = await Project.findOneAndUpdate({ tfs_id: p.id }, {
        tfs_id: p.id,
        name: p.name,
        tfs_name: p.name,
        description: p.desciption,
        repos: [],
        iterations: [],
        members: []
      }, options)
      if (project.status === 'active') {
        const its = await wit.getTeamIterations({ projectId: p.id })
        for (let j = 0; j < its.length; j++) {
          const it = its[j]
          const iter = await Iteration.findOneAndUpdate({ iid: it.id }, {
            iid: it.id,
            name: it.name,
            startDate: it.attributes.startDate,
            finishDate: it.attributes.finishDate
          }, options)
          project.iterations.push(iter._id)
        }
        const prepos = await gitApi.getRepositories(p.id)
        for (let j = 0; j < prepos.length; j++) {
          const rep = prepos[j]
          const re = await Repo.findOneAndUpdate({ rid: rep.id }, {
            rid: rep.id,
            name: rep.name,
          }, options)
          project.repos.push(re._id)
        }
        const teams = await core.getTeams(p.id)
        const members = await core.getTeamMembers(p.id, teams[0].id)
        for (let j = 0; j < members.length; j++) {
          const t = members[j]
          const member = await Team.findOneAndUpdate({ tid: t.id }, {
            tid: t.id,
            displayName: t.displayName,
            uniqueName: t.uniqueName
          }, options)
          project.members.push(member._id)
        }
        await project.save()
      }
      ctx.body = { success: true }
  
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('get', ':project/workitems')
  async workitems (ctx) {
   try {
    const project = ctx.params.project
    const wit = webApi.getWorkItemTrackingApi()
    const wits = await wit.queryByWiql({ query: `SELECT [System.Id] FROM WorkItemLinks WHERE ([Source].[System.TeamProject] = @project AND  [Source].[System.WorkItemType] IN GROUP 'Microsoft.RequirementCategory') AND ([System.Links.LinkType] <> '') And ([Target].[System.State] <> 'Removed' AND [Target].[System.WorkItemType] NOT IN GROUP 'Microsoft.FeatureCategory') mode(MustContain)` }, { projectId: project })
    let data = new Map()
    let ids = new Map()
    wits.workItemRelations.forEach(d => {
      if (d.rel && d.rel === 'System.LinkTypes.Hierarchy-Forward') {
        data.get(d.source.id).add(d.target.id)
      } else {
        data.set(d.target.id, new Set())
      }
      ids.set(d.target.id, {})
    })
    var workItems = await wit.getWorkItems([...ids.keys()])
    workItems.forEach(w => {
      ids.set(w.id, w)
    })
    let options = { upsert: true, new: true, setDefaultsOnInsert: true }
    for(let [k, d] of data) {
      const sid = ids.get(k)
      let w = {
        project,
        wid: sid.id,
        type: sid['fields']['System.WorkItemType'],
        iteration: sid['fields']['System.IterationPath'].split('\\').reverse()[0],
        title: sid['fields']['System.Title'],
        description: sid['fields']['System.Description'],
        createdBy: sid['fields']['System.CreatedBy'],
        createdDate: sid['fields']['System.CreatedDate'],
        assignedTo: sid['fields']['System.AssignedTo'],
        state: sid['fields']['System.State'],
        activatedBy: sid['fields']['Microsoft.VSTS.Common.ActivatedBy'],
        activatedDate: sid['fields']['Microsoft.VSTS.Common.ActivatedDate'],
        closedBy: sid['fields']['Microsoft.VSTS.Common.ClosedBy'],
        closedDate: sid['fields']['Microsoft.VSTS.Common.ClosedDate'],
        tasks: [] }
      let wdb = await WorkItem.findOneAndUpdate({ project, wid: sid.id }, w, options)
      let tasks = []
      console.log(k)
      for (let sub of d) {
        console.log('sub', sub)
        const tid = ids.get(sub)
        const subdb = await WorkItem.findOneAndUpdate({ project, wid: tid.id }, {
          project,
          parent: wdb._id,
          wid: tid.id,
          type: tid['fields']['System.WorkItemType'],
          iteration: tid['fields']['System.IterationPath'].split('\\').reverse()[0],
          title: tid['fields']['System.Title'],
          description: tid['fields']['System.Description'],
          createdBy: tid['fields']['System.CreatedBy'],
          createdDate: tid['fields']['System.CreatedDate'],
          assignedTo: tid['fields']['System.AssignedTo'],
          state: tid['fields']['System.State'],
          activatedBy: tid['fields']['Microsoft.VSTS.Common.ActivatedBy'],
          activatedDate: tid['fields']['Microsoft.VSTS.Common.ActivatedDate'],
          closedBy: tid['fields']['Microsoft.VSTS.Common.ClosedBy'],
          closedDate: tid['fields']['Microsoft.VSTS.Common.ClosedDate']
        }, options)
        wdb.tasks.push(subdb._id)
        await wdb.save()
      }
    }
    ctx.body = { success: true }
   } catch (error) {
     ctx.body = { success: false, error: error.message }
   }
  }
  @route('get', 'test/:project')
  async test (ctx) {
    try {
      const project = ctx.params.project
      const wit = webApi.getWorkItemTrackingApi()
      const wits = await wit.getReportingLinks(project)
      const dids = await wit.getDeletedWorkItemReferences(project)
      let del = new Set()
      dids.forEach(d => del.add(d.id))
     
      let data = new Map()
      let ids = new Map()
      wits.values.forEach(d => {
        if (!del.has(d.sourceId) && !del.has(d.targetId)) {
          if (!data.has(d.sourceId)) {
            ids.set(d.sourceId, {})
            ids.set(d.targetId, {})
            let tids = new Set()
            tids.add(d.targetId)
            data.set(d.sourceId, tids)
          } else {
            ids.set(d.targetId, {})
            data.get(d.sourceId).add(d.targetId)
          }
        }
      })
      var workItems = await wit.getWorkItems([...ids.keys()])
      workItems.forEach(w => {
        ids.set(w.id, w)
      })
      ctx.body = [...ids.values()]
    } catch (error) {
      console.log(error)
    }
  }
}


export default VstsRest
