import {main} from './main'

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
