import { RestGen, route } from 'microback'
import Auth from 'helper/auth'
import Pull from 'helper/git'
import Shell from 'helper/shell'
import Project from 'model/project'
import WorkItem from 'model/workitem'
import Iteration from 'model/iteration'
import Repo from 'model/repo'

export default class ProjectRest extends RestGen {
  constructor () {
    super('project', Project)
  }
  async find (ctx) {
    try {
      const projects = await Project.find().select({ name: 1, status: 1, tfs_id: 1 }).exec()
      ctx.body = { success: true, data: projects }
    } catch (error) {
      ctx.body = { success: false, error }
    }
  }
  @route('get', 'statistic')
  async statistic (ctx) {
    try {
      let projects = await Project.find({ status: 'active' }).select({ user: 0, password: 0 }).populate('repos').populate('iterations').populate('members').exec()
      projects = JSON.parse(JSON.stringify(projects))
      for (let i = 0; i < projects.length; i++) {
        let project = projects[i]
        const ccount = await WorkItem.count({ project: project.tfs_id, state: 'Closed', type: 'User Story', isAccepted: false })
        project.taskClosed = ccount
        const activeIterations = project.iterations.filter(i => i.status === 'plan').map(i => i.name)
        for (let j = 0; j < project.members.length; j++) {
          const member = project.members[j]
          const mcount = await WorkItem.count({ project: project.tfs_id, assignedTo: `${member.displayName} <${member.uniqueName}>`, state: 'New', iteration: { '$in': activeIterations } })
          const macount = await WorkItem.count({ project: project.tfs_id, assignedTo: `${member.displayName} <${member.uniqueName}>`, state: 'Active', iteration: { '$in': activeIterations } })
          const mccount = await WorkItem.count({ project: project.tfs_id, assignedTo: `${member.displayName} <${member.uniqueName}>`, state: 'Closed', iteration: { '$in': activeIterations } })
          member.taskCount = mcount
          member.taskActive = macount
          member.taskClosed = mccount
        }
        for (let j = 0; j < project.iterations.length; j++) {
          const iteration = project.iterations[j]
          const mcount = await WorkItem.count({ project: project.tfs_id, iteration: iteration.name, $or: [{ state: 'New' }, { state: 'Active' }] })
          iteration.taskCount = mcount
        }
      }
      ctx.body = { success: true, data: projects }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('get', ':project/workitems')
  async findWorkItems (ctx) {
    try {
      const project = ctx.params.project
      const projectObj = await Project.findOne({ _id: project }).select({ tfs_id: 1 }).exec()
      const workitems = await WorkItem.find({ project: projectObj.tfs_id, type: 'User Story' }).populate('tasks').exec()
      ctx.body = { success: true, data: workitems }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }

  async create (ctx) {
    try {
      const body = ctx.request.body
      if (body.password) {
        const crypted = Auth.encrypt(body.password)
        body.password = crypted
      }
      var project = await Project.create(body)
      ctx.body = { success: true, data: project }
    } catch (error) {
      ctx.body = { success: true, error }
    }
  }

  async update (ctx) {
    const result = await Project.update({ _id: ctx.request.body.id }, ctx.request.body)
    ctx.body = { success: true, data: result }
  }

  async remove (ctx) {
    const id = ctx.params.id
    const result = await Project.remove({ _id: id })
    ctx.body = { success: true }
  }
  @route('patch', ':project/close')
  async close (ctx) {
    const id = ctx.params.project
    const result = await Project.update({ _id: id }, { status: 'closed' })
    ctx.body = { success: true, data: result }
  }
  @route('patch', ':milestone/release')
  async release (ctx) {
    const id = ctx.params.milestone
    const result = await Iteration.update({ _id: id }, { status: 'released' })
    ctx.body = { success: true, data: result }
  }
  @route('patch', 'repo/:id')
  async repoUpdate (ctx) {
    const id = ctx.params.id
    const body = ctx.request.body
    const result = await Repo.update({ _id: id }, body)
    ctx.body = { success: true, data: result }
  }
  @route('post', ':project/pull/:repo')
  async pull (ctx) {
    try {
      const repoId = ctx.params.repo
      var project = await Project.findOne({ _id: ctx.params.project }).populate('repos').exec()
      if (project) {
        const dec = Auth.decrypt(project.password)
        const branch = project.repos.find(r => r.id === repoId)
        var oid = await Pull(branch.location, project.user, dec, branch.branch)
        var result = {}
        if (project.previous_oid && project.previous_oid !== oid.oid) {
          result = Shell.exec(project.args, project.location)
        } else {
          result.status = 'No Change'
        }
        project.previous_oid = oid.oid
        await project.save()
        ctx.body = { success: true, data: result }
      } else {
        ctx.body = { success: false, error: 'Project not found!' }
      }
    } catch (e) {
      ctx.body = { success: false, error: e.message }
    }
  }

  @route('get', ':project/rebuild')
  async rebuild (ctx) {
    try {
      var project = await Project.findOne({ _id: ctx.params.project }).exec()
      if (project) {
        const result = Shell.exec(project.args, project.location)
        ctx.body = { success: true, data: result }
      } else {
        ctx.body = { success: false, error: 'Project not found!' }
      }
    } catch (e) {
      ctx.body = { success: false, error: e.message }
    }
  }
}
