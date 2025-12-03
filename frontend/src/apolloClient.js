import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    // This keeps pagination sane later; we can refine when we implement UI pagination.
    typePolicies: {
      Query: {
        fields: {
          employees: {
            keyArgs: ["filter", "sort"], // pagination args vary; filter/sort identify the list
            merge(_, incoming) {
              return incoming; // simple POC: replace results each time
            },
          },
        },
      },
    },
  }),
});
