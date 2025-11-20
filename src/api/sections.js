import api from './index'

export default {
  getAllSections() {
    return api.get('/sections')
  },

  getSection(id) {
    return api.get(`/sections/${id}`)
  },

  createSection(data) {
    return api.post('/sections', data)
  },

  updateSection(id, data) {
    return api.put(`/sections/${id}`, data)
  },

  deleteSection(id) {
    return api.delete(`/sections/${id}`)
  },

  getActiveStudents(sectionId) {
    return api.get(`/sections/${sectionId}/active-students`)
  },

  getAllStudents(sectionId) {
    return api.get(`/sections/${sectionId}/all-students`)
  }
}
