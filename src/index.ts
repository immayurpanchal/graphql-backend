import express from 'express'
import cors from 'cors'
import type { Application } from 'express'
import { graphqlHTTP } from 'express-graphql'
import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql'
import { authors, AuthorType, books, BookType } from './data'

const app: Application = express()

const SortInputType = new GraphQLInputObjectType({
  name: 'SortInput',
  fields: {
    sortCriteria: {
      type: new GraphQLList(
        new GraphQLInputObjectType({
          name: 'SortCriteriaInput',
          fields: {
            field: { type: GraphQLString },
            order: { type: GraphQLString }
          }
        })
      )
    }
  }
})

type SortCriteria = {
  field: string
  order: 'ASC' | 'DESC'
}

type Sort = {
  sortCriteria: SortCriteria[]
}

const sortResolver = <T extends Record<PropertyKey, string | number>>(
  oldData: T[],
  sort: Sort
) => {
  const data = [...oldData]
  if (sort && sort.sortCriteria) {
    return data.sort((a, b) => {
      for (const criteria of sort.sortCriteria) {
        const field = criteria.field
        const order = criteria.order
        if (a[field] < b[field]) {
          return order === 'ASC' ? -1 : 1
        } else if (a[field] > b[field]) {
          return order === 'ASC' ? 1 : -1
        }
      }
      return 0
    })
  }
  return data
}

const RootQuery = new GraphQLObjectType({
  name: 'Query',
  description: 'Root Query description',
  fields: {
    author: {
      type: AuthorType,
      description: 'A single author',
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args) => authors.find(author => author.id === args.id)
    },
    book: {
      type: BookType,
      description: 'A single book',
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args) => books.find(book => book.id === args.id)
    },
    // All supported fields at the root level
    getBooks: {
      type: new GraphQLList(BookType),
      description: 'List of all books',
      args: {
        sort: { type: SortInputType }
      },
      resolve: (parent, args) => {
        const sortedBooks = sortResolver(books, args.sort)
        return sortedBooks
      }
    },
    authors: {
      type: new GraphQLList(AuthorType),
      description: 'List of all authors',
      resolve: () => authors
    }
  }
})

const RootMutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Root Mutation description',
  fields: () => ({
    addBook: {
      type: BookType,
      description: 'Add a book',
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        authorId: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: (parent, args) => {
        const book = {
          id: books.length + 1,
          name: args.name,
          authorId: args.authorId
        }
        books.push(book)
        return book
      }
    }
  })
})

const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation
})

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
)

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true
  })
)

app.listen(3000, () => {
  console.log('Listening on port 3000')
})
