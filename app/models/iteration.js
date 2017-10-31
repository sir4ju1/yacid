import { model } from 'microback'

export default model({
  name: 'Iteration',
  schema: {
    iid: String,
    name: String,
    startDate: Date,
    finishDate: Date,
    status: {
      type: String,
      default: 'plan'
    }
  }
})
