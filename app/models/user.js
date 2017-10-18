import { model } from 'microback'

const User = model({
  name: 'User',
  schema: {
    name: String,
    email: {
      type: String,
      unique: true
    },
    password: String
  }
})

export default User
