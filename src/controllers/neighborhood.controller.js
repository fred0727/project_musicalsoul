import CRUD from '../utils/CRUD.js'

class NeightborhoodController extends CRUD {}
export default new NeightborhoodController({
  readMany: {
    query: 'SELECT name, id FROM neighborhoods WHERE district_id = ?',
    type: 'params',
    search (params) {
      return [params.id]
    },
    json: true
  }
})
