import { gql } from "@apollo/client";

export const ADD_EMPLOYEE_MUTATION = gql`
  mutation AddEmployee($input: AddEmployeeInput!) {
    addEmployee(input: $input) {
      id
      name
      age
      class
      subjects
      attendance
      flagged
      updatedAt
    }
  }
`;

export const FLAG_EMPLOYEE_MUTATION = gql`
  mutation FlagEmployee($id: ID!, $flagged: Boolean!) {
    flagEmployee(id: $id, flagged: $flagged) {
      id
      flagged
      updatedAt
    }
  }
`;

export const DELETE_EMPLOYEE_MUTATION = gql`
  mutation DeleteEmployee($id: ID!) {
    deleteEmployee(id: $id)
  }
`;

export const UPDATE_EMPLOYEE_MUTATION = gql`
  mutation UpdateEmployee($id: ID!, $input: UpdateEmployeeInput!) {
    updateEmployee(id: $id, input: $input) {
      id
      name
      age
      class
      subjects
      attendance
      flagged
      updatedAt
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      role
      userId
    }
  }
`;

export const EMPLOYEES_QUERY = gql`
  query Employees($filter: EmployeeFilterInput, $sort: EmployeeSortInput, $pagination: PaginationInput) {
    employees(filter: $filter, sort: $sort, pagination: $pagination) {
      items {
        id
        name
        age
        class
        subjects
        attendance
        flagged
        updatedAt
      }
      pageInfo {
        page
        pageSize
        totalCount
        hasNextPage
      }
    }
  }
`;

export const EMPLOYEE_QUERY = gql`
  query Employee($id: ID!) {
    employee(id: $id) {
      id
      name
      age
      class
      subjects
      attendance
      flagged
      createdAt
      updatedAt
    }
  }
`;
