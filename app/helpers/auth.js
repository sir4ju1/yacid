import crypto from 'crypto'

const encrypt = (password) => {
  const algorithm = 'aes-256-ctr'
  const secret = 'my-secret'
  var cipher = crypto.createCipher(algorithm, secret)
  var crypted = cipher.update(password, 'utf8', 'hex')
  crypted += cipher.final('hex')
  return crypted
}

const decrypt = (password) => {
  const algorithm = 'aes-256-ctr'
  const secret = 'my-secret'
  var decipher = crypto.createDecipher(algorithm, secret)
  var dec = decipher.update(password, 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec
}

export default { encrypt, decrypt }
