import { RestGen, route } from 'microback'
import Auth from 'helper/auth'
import Pull from 'helper/git'
import Shell from 'helper/shell'
import Project from 'model/project'

export default class ProjectRest extends RestGen {
  constructor () {
    super('project')
  }
  async find (ctx) {
    try {
      const projects = await Project.find().select({ name: 1, location: 1, branch: 1, args: 1, previous_oid: 1 }).exec()
      ctx.body = { success: true, data: projects }
    } catch (error) {
      ctx.body = { success: false, error }
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

  @route('post', ':project/pull')
  async pull (ctx) {
    try {
      var project = await Project.findOne({ _id: ctx.params.project }).exec()
      if (project) {
        const dec = Auth.decrypt(project.password)
        var oid = await Pull(project.location, project.user, dec, project.branch)
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
