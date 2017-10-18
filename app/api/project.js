import { RestGen, route } from 'microback'
import crypto from 'crypto'
import Pull from 'helper/git'
import Project from 'model/project'
import shell from 'shelljs'
import { spawnSync, spawn, exec, execSync } from 'child_process'

export default class ProjectRest extends RestGen {
  constructor () {
    super('project')
  }
  async find (ctx) {
    try {
      const projects = await Project.find().select({ name: 1, location: 1, args: 1, previous_oid: 1 }).exec()
      ctx.body = { success: true, data: projects }
    } catch (error) {
      ctx.body = { success: false, error }
    }
  }

  async create (ctx) {
    try {
      const body = ctx.request.body
      if (body.password) {
        const algorithm = 'aes-256-ctr'
        const secret = 'my-secret'
        var cipher = crypto.createCipher(algorithm, secret)
        var crypted = cipher.update(body.password, 'utf8', 'hex')
        crypted += cipher.final('hex')
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

  @route('post', 'pull/:project')
  async pull (ctx) {
    try {
      var project = await Project.findOne({ _id: ctx.params.project }).exec()
      if (project) {
        const algorithm = 'aes-256-ctr'
        const secret = 'my-secret'
        var decipher = crypto.createDecipher(algorithm, secret)
        var dec = decipher.update(project.password, 'hex', 'utf8')
        dec += decipher.final('utf8')
        var oid = await Pull(project.location, project.user, dec)
        // var oid = { oid: 0 }
        var status = ['No change']
        var error = []
        var pid = []
        if (project.previous_oid && project.previous_oid == oid.oid) {
          shell.set('-e')
          var env = require('dotenv').config({ path: `${project.location}/.env` })
          for (var i = 0; i < project.args.length; i++) {            
            const result = shell.exec(project.args[i], { cwd: project.location, env: env.parsed })
            pid.push(result.pid)
            if (result.code !== 0) {
              error.push(result.stderr)
              break
            } else {
              status.push(result.stdout)
            }
          }        
        }
        project.previous_oid = oid.oid
        await project.save()
        ctx.body = { success: true, data: { pid, status, error } }
      } else {
        ctx.body = { success: false, error: 'Project not found!' }
      }
    } catch (e) {
      ctx.body = { success: false, error: e.message }
    }
  }
}
