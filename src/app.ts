import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { transactionRoutes } from './routes/diet'

export const app = fastify()

app.register(cookie)
app.register(transactionRoutes, {
  prefix: 'transactions',
})