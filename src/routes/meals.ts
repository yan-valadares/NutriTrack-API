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

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      await knex('meals').where({ id, session_id: sessionId }).del()

      return reply.status(204).send()
    },
  )

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const mealsQuantityQuery = await knex('meals')
        .count()
        .where({ session_id: sessionId })

      const mealsQuantity = mealsQuantityQuery[0]['count(*)']

      const healthyMealsQuantityQuery = await knex('meals')
        .count()
        .where({ session_id: sessionId, healthy: true })

      const healthyMealsQuantity = healthyMealsQuantityQuery[0]['count(*)']

      const unhealthyMealsQuantityQuery = await knex('meals')
        .count()
        .where({ session_id: sessionId, healthy: false })

      const unhealthyMealsQuantity = unhealthyMealsQuantityQuery[0]['count(*)']

      const longestHealthySequence = await knex.raw(
        `
        SELECT MAX(healthy_sequence) as longest_sequence
        FROM (
          SELECT COUNT(*) as healthy_sequence
          FROM (
            SELECT *,
              CASE
                WHEN LAG(healthy, 1, 0) OVER (PARTITION BY session_id ORDER BY meal_time) = 1 THEN 1
                ELSE ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY meal_time)
              END AS group_sequence
            FROM meals
            WHERE session_id = :sessionId
          ) AS subquery
          WHERE healthy = 1
          GROUP BY group_sequence
        ) AS subquery2
        `,
        { sessionId },
      )

      const longestSequence = longestHealthySequence[0].longest_sequence

      return {
        mealsQuantity,
        healthyMealsQuantity,
        unhealthyMealsQuantity,
        longestSequence,
      }
    },
  )
}
