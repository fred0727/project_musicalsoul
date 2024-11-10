import CRUD from '../utils/CRUD.js'

class DistrictController extends CRUD {}
export default new DistrictController({
  readMany: {
    query: 'SELECT name, id FROM districts WHERE province_id = ?',
    type: 'params',
    search (params) {
      console.log(params)
      return [params.id]
    },
    json: true
  }
})
