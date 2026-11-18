import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

export const getHealth = () => api.get('/health')
export const getOverview = () => api.get('/dashboard/overview')
export const getLatestSensors = () => api.get('/sensors/latest')
export const getSensorHistory = (n = 200) => api.get(`/sensors/history?last_n=${n}`)
export const getCurrentAnomaly = () => api.get('/anomaly/current')
export const getAnomalyHistory = (n = 200) => api.get(`/anomaly/history?last_n=${n}`)
export const getCurrentExplainability = () => api.get('/explainability/current')
export const getSensorContributions = () => api.get('/explainability/sensor-contributions')
export const getAlerts = () => api.get('/alerts')
export const acknowledgeAlert = (id: string) => api.post(`/alerts/${id}/acknowledge`)
export const resolveAlert = (id: string) => api.post(`/alerts/${id}/resolve`)
export const startSimulation = (speed = 1) => api.post(`/simulation/start?speed=${speed}`)
export const pauseSimulation = () => api.post('/simulation/pause')
export const resumeSimulation = () => api.post('/simulation/resume')
export const stopSimulation = () => api.post('/simulation/stop')
export const resetSimulation = () => api.post('/simulation/reset')
export const getSimulationStatus = () => api.get('/simulation/status')
export const getModels = () => api.get('/models')
export const getModelComparison = () => api.get('/models/comparison')

export default api
