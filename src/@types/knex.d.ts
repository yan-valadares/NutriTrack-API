// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      name: string
      description: string
      meal_time: string
      healthy: Boolean
      session_id?: string
    }
    users: {
      id: string
      user: string
      password: string
      created_at: string
    }
  }
}
