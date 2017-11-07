import { model } from 'microback'

export default model({
  name: 'Repo',
  schema: {
    rid: String,
    name: String,
    user: String,
    password: String,
    previous_oid: String,
    location: String,
    branch: {
      type: String,
      default: 'master'
    },
    args: [String]
  }
})
