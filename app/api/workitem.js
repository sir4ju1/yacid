import { RestGen, route } from 'microback'
import Project from 'model/project'
import WorkItem from 'model/workitem'


export default class WorkItemRest extends RestGen {
  constructor () {
    super('workitem')
  }
  @route('post', 'member')
  async projectByMember (ctx) {
    try {
      const project = ctx.request.body.project
      const assignedTo = ctx.request.body.assignedTo
      const tasks = await WorkItem.find({ project, assignedTo, type: { $in: ['Task', 'Bug']}, state: { $ne: 'Closed' } })
        .populate('parent').exec()
      let allData = JSON.parse(JSON.stringify(tasks))
      let data = new Map()
      allData.forEach((t) => {
        let p = Object.assign({}, t)
        delete p.parent
        if (!data.has(t.parent._id)){
          if (!t.parent.data) {
            t.parent.data = []
          }
          p.key = p._id
          t.parent.key = t.parent._id
          t.parent.data.push(p)
          data.set(t.parent._id, t.parent)
        } else {
          const parent = data.get(t.parent._id)
          p.key = p._id
          parent.data.push(p)
        }
      }, this)
      let wits =  [...data.values()]
      wits.sort((a, b) => {
        if (a.iteration < b.iteration) {
          return -1
        } else if (a.iteration > b.iteration) {
          return 1
        }
        return 0
      })
      ctx.body = { success: true, data: wits }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  } 
  @route('post', 'state')
  async projectByStatus (ctx) {
    try {
      const project = ctx.request.body.project
      const state = ctx.request.body.state
      const isAccepted = ctx.request.body.isAccepted
      const data = await WorkItem.find({ project, type: 'User Story', state, isAccepted })
        .select({ title: 1, iteration: 1, closedDate: 1, activatedDate: 1  })
        .sort({ iteration: 1 })
        .exec()
      ctx.body = { success: true, data }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('post', 'milestone')
  async projectByMilestone (ctx) {
    try {
      const project = ctx.request.body.project
      const iteration = ctx.request.body.iteration
      const data = await WorkItem.find({ project, iteration, type: 'User Story' })
        .select({ title: 1, iteration: 1, type: 1, state: 1, closedDate: 1, activatedDate: 1, tasks: 1 })
        .sort({ iteration: 1 })
        .populate({ path: 'tasks', select: { title: 1, iteration: 1, type: 1, state: 1, closedDate: 1, activatedDate: 1, tasks: 1 } })
        .exec()
      let wits = JSON.parse(JSON.stringify(data))
      wits.forEach(w => {
        w.key = w._id
        w.data = []
        w.tasks.forEach(t => {
          t.key = t._id
          w.data.push(Object.assign({}, t))
        })
        delete w.tasks
      })
      ctx.body = { success: true, data: wits }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('get', 'accept/:id')
  async acceptWorkItem (ctx) {
    try {
      const id = ctx.params.id
      const data = await WorkItem.update({ _id, id }, { isAccepted: true, acceptedDate: new Date() })
      ctx.body = { success: true, data }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
}
