import { model } from 'microback'
import crypto from 'crypto'

const Project = model({
  name: 'Project',
  schema: {
    name: String,
    location: String,
    user: String,
    password: String,
    previous_oid: String,
    branch: {
      type: String,
      default: 'master'
    },
    args: [String]
  }
})

export default Project
