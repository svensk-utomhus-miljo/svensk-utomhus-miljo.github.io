import { sha1 } from './util.js'

const staff = [].map(async staff => {
  if (!staff.photoURI && staff.mail) {
    // create gravatar:
    const hash = await sha1(staff.mail)
    staff.photoURI = `https://gravatar.com/avatar/${hash}`
    console.log(staff.photoURI)
  } else {
    staff.photoURI = `https://gravatar.com/avatar/`
  }
  return staff
})

export default await Promise.all(staff)