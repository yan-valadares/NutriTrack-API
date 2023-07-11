import { it, expect, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Testing routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex -- migrate:rollback --all')
    execSync('npm run knex -- migrate:latest')
  })

  describe('Users routes', () => {
    it('should be able to create a new user', async () => {
      await request(app.server)
        .post('/users/signUp')
        .send({
          login: 'user',
          password: '123456',
        })
        .expect(201)
    })

    it('should be able to login', async () => {
      await request(app.server).post('/users/signUp').send({
        login: 'user',
        password: '123456',
      })

      await request(app.server)
        .post('/users/login')
        .send({
          login: 'user',
          password: '123456',
        })
        .expect(200)
    })
  })

  describe('Meals routes', () => {
    it('should be able to register a meal', async () => {
      await request(app.server).post('/users/signUp').send({
        login: 'user',
        password: '123456',
      })

      const userLoginResponse = await request(app.server)
        .post('/users/login')
        .send({
          login: 'user',
          password: '123456',
        })

      const cookies = userLoginResponse.get('Set-Cookie')

      await request(app.server)
        .post('/meals')
        .set('Cookie', cookies)
        .send({
          name: 'Healthy food',
          description: 'Healthy food description',
          healthy: 'yes',
        })
        .expect(201)
    })

    it('should be able to edit a meal', async () => {
      await request(app.server).post('/users/signUp').send({
        login: 'user',
        password: '123456',
      })

      const userLoginResponse = await request(app.server)
        .post('/users/login')
        .send({
          login: 'user',
          password: '123456',
        })

      const cookies = userLoginResponse.get('Set-Cookie')

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'Healthy food',
        description: 'Healthy food description',
        healthy: 'yes',
      })

      const listMealsResponse = await request(app.server)
        .get('/meals')
        .set('Cookie', cookies)

      const mealToBeUpdated = listMealsResponse.body.meals[0].id

      await request(app.server)
        .put('/meals/update/' + mealToBeUpdated)
        .set('Cookie', cookies)
        .send({
          name: 'Unhealthy food',
          description: 'unhealthy food description',
          healthy: 'no',
        })
        .expect(202)
    })

    it('should be able to delete a meal', async () => {
      await request(app.server).post('/users/signUp').send({
        login: 'user',
        password: '123456',
      })

      const userLoginResponse = await request(app.server)
        .post('/users/login')
        .send({
          login: 'user',
          password: '123456',
        })

      const cookies = userLoginResponse.get('Set-Cookie')

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'Healthy food',
        description: 'Healthy food description',
        healthy: 'yes',
      })

      const listMealsResponse = await request(app.server)
        .get('/meals')
        .set('Cookie', cookies)

      const mealToBeDeleted = listMealsResponse.body.meals[0].id

      await request(app.server)
        .delete('/meals/' + mealToBeDeleted)
        .set('Cookie', cookies)
        .send()
        .expect(204)
    })

    it('should be able to get all meals of an user', async () => {
      await request(app.server).post('/users/signUp').send({
        login: 'user',
        password: '123456',
      })

      const userLoginResponse = await request(app.server)
        .post('/users/login')
        .send({
          login: 'user',
          password: '123456',
        })

      const cookies = userLoginResponse.get('Set-Cookie')

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'Healthy food',
        description: 'Healthy food description',
        healthy: 'yes',
      })

      const listMealsResponse = await request(app.server)
        .get('/meals')
        .set('Cookie', cookies)
        .expect(200)

      expect(listMealsResponse.body.meals).toEqual([
        expect.objectContaining({
          name: 'Healthy food',
          description: 'Healthy food description',
          healthy: 1,
        }),
      ])
    })

    it('should be possible to get a unique meal', async () => {
      await request(app.server).post('/users/signUp').send({
        login: 'user',
        password: '123456',
      })

      const userLoginResponse = await request(app.server)
        .post('/users/login')
        .send({
          login: 'user',
          password: '123456',
        })

      const cookies = userLoginResponse.get('Set-Cookie')

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'Healthy food',
        description: 'Healthy food description',
        healthy: 'yes',
      })

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'Unhealthy food',
        description: 'Unhealthy food description',
        healthy: 'no',
      })

      const listMealsResponse = await request(app.server)
        .get('/meals')
        .set('Cookie', cookies)

      const mealToBeGet = listMealsResponse.body.meals[0].id

      const mealGotted = await request(app.server)
        .get('/meals/' + mealToBeGet)
        .set('Cookie', cookies)
        .send()
        .expect(200)

      expect(mealGotted.body.meal).toEqual(
        expect.objectContaining({
          name: 'Healthy food',
          description: 'Healthy food description',
          healthy: 1,
        }),
      )
    })

    it('should be able to get the metrics of an user', async () => {
      await request(app.server).post('/users/signUp').send({
        login: 'user',
        password: '123456',
      })

      const userLoginResponse = await request(app.server)
        .post('/users/login')
        .send({
          login: 'user',
          password: '123456',
        })

      const cookies = userLoginResponse.get('Set-Cookie')

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'Healthy food',
        description: 'Healthy food description',
        healthy: 'yes',
      })

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'Anhother healthy food',
        description: 'Another healthy food description',
        healthy: 'yes',
      })

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'The last healthy food',
        description: 'The last healthy food description',
        healthy: 'yes',
      })

      await request(app.server).post('/meals').set('Cookie', cookies).send({
        name: 'Unhealthy food',
        description: 'Unealthy food description',
        healthy: 'no',
      })

      const getUserMetricsResponse = await request(app.server)
        .get('/meals/metrics')
        .set('Cookie', cookies)
        .send()
        .expect(200)

      expect(getUserMetricsResponse.body).toEqual(
        expect.objectContaining({
          mealsQuantity: 4,
          healthyMealsQuantity: 3,
          unhealthyMealsQuantity: 1,
          longestSequence: 3,
        }),
      )
    })
  })
})
