import { model } from 'microback'

const WorkItem = model({
  name: 'WorkItem',
  schema: {
    project: String,
    parent: {
      type: 'ObjectId',
      ref: 'WorkItem'
    },
    wid: String,
    type: String,
    iteration: String,
    title: String,
    description: String,
    createdBy: String,
    createdDate: Date,
    assignedTo: String,
    state: String,
    activatedBy: String,
    activatedDate: Date,
    closedBy: String,
    closedDate: Date,
    isAccepted: {
      type: Boolean,
      default: false
    },
    acceptedDate: Date,
    isOpt: Boolean,
    tasks: [{
      type: 'ObjectId',
      ref: 'WorkItem'
    }]
  }
})

export default WorkItem
