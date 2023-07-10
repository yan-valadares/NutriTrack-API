import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import bcrypt from 'bcrypt'

export async function userRoutes(app: FastifyInstance) {
  app.post('/signUp', async (request, reply) => {
    const createUserBodySchema = z.object({
      login: z.string(),
      password: z.string(),
    })

    const { login, password } = createUserBodySchema.parse(request.body)
    const hashedPassword = await bcrypt.hash(password, 10)
    const id = randomUUID()

    await knex('users').insert({
      id,
      user: login,
      password: hashedPassword,
    })

    return reply.status(201).send()
  })

  app.post('/login', async (request, reply) => {
    const createUserBodySchema = z.object({
      login: z.string(),
      password: z.string(),
    })

    const { login, password } = createUserBodySchema.parse(request.body)

    const user = await knex('users').where({ user: login }).select().first()
    if (user == null) {
      return reply.status(400).send('User not founded')
    }

    if (await bcrypt.compare(password, user.password)) {
      reply.cookie('sessionId', user.id, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
      reply.status(200).send('Sucessful login')
    } else {
      reply.status(401).send('Unauthorized')
    }
  })
}
