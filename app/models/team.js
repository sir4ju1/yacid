import { model } from 'microback'

export default model({
  name: 'Team',
  schema: {
    tid: String,
    displayName: String,
    uniqueName: String
  }
})
