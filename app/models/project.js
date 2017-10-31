import { model } from 'microback'

const Project = model({
  name: 'Project',
  schema: {
    name: String,
    user: String,
    password: String,
    repos: [{
      type: 'ObjectId',
      ref: 'Repo'
    }],
    tfs_id: String,
    tfs_name: String,
    description: String,
    status: {
      type: String,
      default: 'active'
    },
    iterations: [{
      type: 'ObjectId',
      ref: 'Iteration'
    }],
    members: [{
      type: 'ObjectId',
      ref: 'Team'
    }]
  }
})

export default Project
