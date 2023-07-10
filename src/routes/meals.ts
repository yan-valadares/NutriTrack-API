import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const meals = await knex('meals')
        .select()
        .where({ session_id: sessionId })

      return { meals }
    },
  )

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const meal = await knex('meals')
      .select()
      .where({ id, session_id: sessionId })
      .first()

    return { meal }
  })

  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        healthy: z.enum(['yes', 'no']),
      })

      const { name, description, healthy } = createMealBodySchema.parse(
        request.body,
      )

      const { sessionId } = request.cookies

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        healthy: healthy === 'yes',
        session_id: sessionId,
      })

      return reply.status(201).send()
    },
  )

  app.put(
    '/update/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const putMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        healthy: z.enum(['yes', 'no']),
      })

      const putMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = putMealParamsSchema.parse(request.params)

      const { name, description, healthy } = putMealBodySchema.parse(
        request.body,
      )
      const { sessionId } = request.cookies

      const meal = await knex('meals')
        .where({ id, session_id: sessionId })
        .select()
        .first()

      const updatedName = name === '' ? meal?.name : name
      const updatedDescription =
        description === '' ? meal?.description : description

      await knex('meals')
        .where({ id, session_id: sessionId })
        .update({
          name: updatedName,
          description: updatedDescription,
          healthy: healthy === 'yes',
        })

      return reply.status(202).send()
    },
  )
}
