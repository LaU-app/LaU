import { api } from './api'

const mentionsService = {
  async searchFriends(query) {
    const response = await api.get('/users/search-friends', {
      params: { query }
    })

    return response.data?.data || []
  }
}

export default mentionsService