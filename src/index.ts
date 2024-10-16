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

const BookArgs = new GraphQLInputObjectType({
  name: 'BookArgs',
  fields: {
    id: { type: GraphQLInt }
  }
})

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
      type: GetBooksQuery,
      description: 'List of all books',
      args: {
        sort: { type: GraphQLString, defaultValue: 'ASC' }
      },
      resolve: (parent, args) => {
        const sortedBooks = [...books]
        if (args.sort === 'DESC') {
          sortedBooks.sort((a, b) => b.id - a.id)
        }
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
