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
      const data = await WorkItem.find({ project, assignedTo, type: { $in: ['Task', 'Bug']}, state: { $ne: 'Closed' } })
        .select({ title: 1, iteration: 1, state: 1, type: 1, activatedDate: 1 }).exec()
      ctx.body = { success: true, data }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('post', 'state')
  async projectByStatus (ctx) {
    try {
      const project = ctx.request.body.project
      const state = ctx.request.body.state
      const data = await WorkItem.find({ project, type: 'User Story', state })
        .select({ title: 1, iteration: 1, closedDate: 1, activatedDate: 1  }).exec()
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
      const data = await WorkItem.find({ project, iteration, type: 'User Story', state })
        .select({ title: 1, iteration: 1, closedDate: 1, activatedDate: 1, tasks: 1 })
        .populate('tasks')
        .exec()
      ctx.body = { success: true, data }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
}
