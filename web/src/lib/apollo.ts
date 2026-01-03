import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Create HTTP link to our GraphQL server
const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  // Enable dev tools in development
  connectToDevTools: import.meta.env.DEV,
});