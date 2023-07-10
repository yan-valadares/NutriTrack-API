import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import bcrypt from 'bcrypt'

export async function userRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
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

    reply.cookie('sessionId', id, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })

    return reply.status(201).send
  })
}
