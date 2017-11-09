import { RestGen, route } from 'microback'
import Project from 'model/project'
import WorkItem from 'model/workitem'


export default class WorkItemRest extends RestGen {
  constructor () {
    super('workitem')
  }
  @route('post', 'member')
  async witByMember (ctx) {
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
  async witByStatus (ctx) {
    try {
      const project = ctx.request.body.project
      const state = ctx.request.body.state
      const isAccepted = ctx.request.body.isAccepted
      const data = await WorkItem.aggregate([
        {
          $match: {
            project,
            type: { $in: ['Task', 'Bug'] },
            state: 'Closed',
            isAccepted: { $ne: true }
          }
          
        },
        {
          $lookup: {
            from: 'workitems',
            localField: 'parent',
            foreignField: '_id',
            as: 'par'
          }
        },
        {
          $unwind: '$par'
        },
        {
          $sort: { iteration: 1, rank: 1, wid: 1}
        },
        {
          $group: {
            _id: '$parent',
            title: { $first: '$par.title' },
            rank: { $first: '$par.rank' },
            iteration: { $first: '$par.iteration'},
            wid: { $first: '$par.wid'},
            data: { $addToSet: { _id: '$_id', title: '$title', wid: '$wid', rank: '$rank' } }
  
          }
        },
       
        {
          $unwind: '$data'
        },
        {
          $sort: { 'data.rank': 1, 'data.wid': 1 }
        },
        {
          $group: {
            _id: '$_id',
            title: { $first: '$title' },
            rank: { $first: '$rank' },
            iteration: { $first: '$iteration'},
            key: { $first: '$wid'},
            data: { $push: { _id: '$data._id', key: '$data.wid', title: '$data.title' } }
  
          },
        },
        {
          $sort: { 'iteration': 1, 'rank': 1, 'key': 1 }
        },
        {
          $project: {
            _id: 1,
            iteration: 1,
            title: 1,
            key: 1,
            'data': 1
          }
        },
      ])
      ctx.body = { success: true, data }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }
  @route('post', 'milestone')
  async witByMilestone (ctx) {
    try {
      const project = ctx.request.body.project
      const iteration = ctx.request.body.iteration
      const data = await WorkItem.find({ project, iteration, type: 'User Story' })
        .select({ title: 1, iteration: 1, type: 1, state: 1, closedDate: 1, activatedDate: 1, tasks: 1 })
        .sort({ iteration: 1 })
        .populate({ path: 'tasks', select: { title: 1, iteration: 1, type: 1, state: 1, closedDate: 1, activatedDate: 1 } })
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
  @route('post', 'calendar')
  async witCalendar (ctx) {
    const project = ctx.request.body.project
    const data = await WorkItem.aggregate([
      {
        $match: {
          project: project,
          state: 'Closed',
          isAccepted: true
        }
      },
      {
        $project: {
          accepted: { $dateToString: { format: "%d-%m-%Y", date: "$acceptedDate" } }
        }
      },
      {
        $group: {
          _id: '$accepted',
          count: { $sum: 1 }
        }
      }
    ])
    ctx.body = { success: true, data }
  }
  @route('post', 'date')
  async witByDate (ctx) {
    const project = ctx.request.body.project
    const date = ctx.request.body.date
    const wits = await WorkItem.aggregate([
      {
        $match: {
          project: project,
          state: 'Closed',
          isAccepted: true
        }
      },
      {
        $project: {
          accepted: { $dateToString: { format: "%d-%m-%Y", date: "$acceptedDate" } },
          title: 1, closedDate: 1, tasks: 1
        }
      },
      {
        $match: {
          accepted: date
        }
      }
    ])
    const data = await WorkItem
      .populate(wits, {
        path: 'tasks',
        select: { title: 1, closedDate: 1 },
        match: { state: 'Closed', isAccepted: true }
      })
    ctx.body = { success: true, data }
  }

  async update (ctx) {
    try {
      const id = ctx.request.body.id
      const body = ctx.request.body
      const data = await WorkItem.update({ _id: id }, body)
      ctx.body = { success: true, data }
    } catch (error) {
      ctx.body = { success: false, error: error.message }
    }
  }

  @route('get', 'test/:id') 
  async test (ctx) {
    const id = ctx.params.id
    // const data = await WorkItem.find().populate({ path: 'tasks', match: { isAccepted : true }}).exec()
    // const nData = data.filter(w => w.tasks.length)

    const data = await WorkItem.aggregate([
      {
        $match: {
          project: id,
          type: { $in: ['Task', 'Bug'] },
          state: 'Closed',
          isAccepted: { $ne: true }
        }
        
      },
      {
        $lookup: {
          from: 'workitems',
          localField: 'parent',
          foreignField: '_id',
          as: 'par'
        }
      },
      {
        $unwind: '$par'
      },
      {
        $sort: { iteration: 1, rank: 1, wid: 1}
      },
      {
        $group: {
          _id: '$parent',
          title: { $first: '$par.title' },
          rank: { $first: '$par.rank' },
          iteration: { $first: '$par.iteration'},
          wid: { $first: '$par.wid'},
          data: { $addToSet: { _id: '$_id', title: '$title', wid: '$wid', rank: '$rank' } }

        }
      },
     
      {
        $unwind: '$data'
      },
      {
        $sort: { 'data.rank': 1, 'data.wid': 1 }
      },
      {
        $group: {
          _id: '$_id',
          title: { $first: '$title' },
          rank: { $first: '$rank' },
          iteration: { $first: '$iteration'},
          wid: { $first: '$wid'},
          data: { $push: { _id: '$data._id', title: '$data.title' } }

        },
      },
      {
        $sort: { 'iteration': 1, 'rank': 1, 'wid': 1 }
      },
      {
        $project: {
          _id: 1,
          iteration: 1,
          title: 1,
          'data': 1
        }
      },
    ])
    ctx.body = data
  }
}
