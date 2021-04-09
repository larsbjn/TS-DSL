import knex, { Knex } from 'knex'

export type User = {
  id: number
  name: string
  address?: string
}

export type Post = {
  id: number
  text: string
}

type Constraints<T> = { [key in keyof T]?: Array<(value: any) => boolean> }

const userConstraints: Constraints<User> = {
  address: [(value => !!value)],
  id: [value => value !== 0]
}

const postConstraints: Constraints<Post> = {
  text: [value => value.length > 0]
}

type ConstraintMap<T = unknown> = Map<string, Constraints<T>>

const constraints: ConstraintMap = new Map([
  ['user', userConstraints],
  ['post', postConstraints]
])

const config: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DATABASE_HOST!,
    port: Number(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USER,
  }
}

class Client<T extends Record<string, any>> {
  private readonly client: Knex
  private readonly table: string
  private readonly constraints: Constraints<T>

  constructor(type: string) {
    this.client = knex(config)
    this.table = type
    this.constraints = constraints.get(type)!
  }

  async findFirst<W extends Select<T> | undefined>(where: WhereInput<T>, select?: W): Promise<SelectReturnType<W, T> | undefined> {
    let query = this.client(this.table)

    query = this.generateWhereClause(query, where)

    if (select) query = this.generateSelectClause(query, select!)

    console.log(query.toQuery())

    // @ts-ignore
    return query.first as SelectReturnType<W, T>
  }

  private generateSelectClause(query: Knex.QueryBuilder, select: Select<T>): Knex.QueryBuilder {
    for (const [key, value] of Object.entries(select)) {
      if (value === undefined) continue
      if (value) query = query.select(key)
    }

    return query
  }

  private generateWhereClause(query: Knex.QueryBuilder, where: WhereInput<T>): Knex.QueryBuilder {
    // for (let [key, value] of Object.entries(where)) {
    //   this.parseWhereArg(query, key, value)
    // }
    for (let [key, value] of Object.entries(where)) {
      console.log(key, value)
      if (value === undefined) continue
      query = this.parseWhereArgs(query, key, value)
      // if (typeof value === 'object') {
      //     console.log(value)
      //     clause = this.parseWhereArgs(clause, key, value)
      // } else {
      //   console.log('not object')
      //   clause = this.parseWhereArg(clause, key, value)
      // }

      // query = clause
    }

    return query
  }

  // private isWhereConditional(arg: WhereInputProp<T>[string]): arg is WhereInputConditionals<T> {
  //   if (Object.keys(arg).includes())
  // }

  private parseWhereArgs(query: Knex.QueryBuilder, key: keyof WhereInputProp<T>, arg: WhereInputProp<T>[string]): Knex.QueryBuilder {
    for (let [argKey, argValue] of Object.entries(arg)) {
      console.log('parseArgs', argKey, argValue)
      if (argValue === undefined) continue
      let clause = query
      if (typeof argValue === 'object') {
        if (key === 'AND') {
          console.log('and')
          clause = clause.and = this.parseWhereArg(clause, argKey, argValue)
        } else if (key === 'OR') {
          clause = clause.or
        } else if (key === 'NOT') {
          clause = clause.not
        } else {
          console.log('test')
          clause = this.parseWhereArg(clause, String(key), argValue)
        }
      }

      query = clause
    }

    return query
  }

  private parseWhereArg(query: Knex.QueryBuilder, key: string, arg: { [K in keyof WhereInput<T>]: T[K] }): Knex.QueryBuilder {
    console.log('arg', arg)
    for (const [filterKey, value] of Object.entries(arg)) {
      if (value === undefined) continue
      switch (filterKey as keyof StringFilter | IntFilter | DateTimeNullableFilter) {
        case 'in':
          query = query.whereIn(key, value)
          break
        case 'notIn':
          query = query.not.whereIn(key, value)
          break
        case 'lt':
          query = query.where(key, '<', value)
          break
        case 'lte':
          query = query.where(key, '<=', value)
          break
        case 'gt':
          query = query.where(key, '>', value)
          break
        case 'gte':
          query = query.where(key, '>=', value)
          break
        case 'contains':
          query = query.where(key, 'like', `%${String(value)}%`)
          break
        case 'startsWith':
          query = query.where(key, 'like', `${String(value)}%`)
          break
        case 'endsWith':
          query = query.where(key, 'like', `%${String(value)}`)
          break
        case 'equals':
          query = query.where(key, value)
          break
      }
    }

    return query
  }

  findMany(args: T): T[] {
    // @ts-ignore
    return 'din mor'
  }

  create(args: T): T {
    for (const [key, value] of Object.entries(args)) {
      if (this.handleConstraint(key, value)) throw new Error(`Violated constraint for ${key}: ${value}`)
    }

    // @ts-ignore
    return {} as User
  }

  handleConstraint<T>(key: string, value: unknown): boolean {
    return this.constraints[key] ? this.constraints[key]!.every((constraint) => constraint(value)) : true
  }
}

export const client = {
  user: new Client<User>('user'),
  post: new Client<Post>('post'),
}

type SelectReturnType<W, T> =
  | (W extends undefined ? T : never)
  | (W extends Select<T> ? Partial<T> : never)

export type Enumerable<T> = T | Array<T>

export type StringFilter = {
  equals?: string
  in?: Enumerable<string>
  notIn?: Enumerable<string>
  lt?: string
  lte?: string
  gt?: string
  gte?: string
  contains?: string
  startsWith?: string
  endsWith?: string
  // not?: NestedStringFilter | string
}

export type IntFilter = {
  equals?: number
  in?: Enumerable<number>
  notIn?: Enumerable<number>
  lt?: number
  lte?: number
  gt?: number
  gte?: number
  // not?: NestedIntFilter | number
}

export type DateTimeNullableFilter = {
  equals?: Date | string | null
  in?: Enumerable<Date> | Enumerable<string> | null
  notIn?: Enumerable<Date> | Enumerable<string> | null
  lt?: Date | string
  lte?: Date | string
  gt?: Date | string
  gte?: Date | string
  // not?: NestedDateTimeNullableFilter | Date | string | null
}

type Select<T extends Record<string, any>> = Partial<Record<keyof T, boolean>>
type WhereInput<T extends Record<string, any>> = WhereInputProp<T> & WhereInputConditionals<T>
type WhereInputProp<T extends Record<string, any>> = {
  [K in keyof T]?: WhereInputFilter<T[K]>
}

type WhereInputConditionals<T> = {
  AND?: Enumerable<WhereInputProp<T>>
  OR?: Enumerable<WhereInputProp<T>>
  NOT?: Enumerable<WhereInputProp<T>>
}

type WhereInputFilter<T extends number | string | Date> =
  | (T extends number ? IntFilter : never)
  | (T extends string ? StringFilter : never)
  | (T extends Date ? DateTimeNullableFilter : never)

type HasSelect = {
  select: any
}

export type SelectSubset<T, U> = {
  [K in keyof T]: K extends keyof U ? T[K] : never
}

function find<T extends Record<string, unknown>>(where: T): Record<keyof T, T[keyof T]> {
  // @ts-ignore
  return 'test'
}
