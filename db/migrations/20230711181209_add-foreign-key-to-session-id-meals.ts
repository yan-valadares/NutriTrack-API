import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  knex.schema.alterTable('meals', (table) => {
    table.foreign('session_id').references('users.id')
  })
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.alterTable('meals', (table) => {
    table.dropForeign('session_id')
  })
}
