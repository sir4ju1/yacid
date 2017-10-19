import Git from 'nodegit'

async function pull (repo, user, password, branch) {
  try {
    const repository = await Git.Repository.open(repo)
    await repository.fetchAll({
      callbacks: {
        credentials: (url, username) => {
          return Git.Cred.userpassPlaintextNew(user, password)
        }
      }
    })
    const oid = await repository.rebaseBranches(branch, `origin/${branch}`)
    return { oid, merged: true }
  } catch (error) {
    return { merged: false }
  }
}

export default pull
