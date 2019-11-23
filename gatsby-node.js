const { graphqlForProjects } = require("./src/scripts/create-projects");
const { graphqlForBlog } = require("./src/scripts/create-blog");

function createIndividualPages(actions, graphql) {
  const { createPage } = actions;

  return Promise.all([
    graphqlForProjects(graphql, createPage),
    graphqlForBlog(graphql,createPage)
  ])
}

exports.createPages = ({ graphql, actions }) => {
  return createIndividualPages(actions, graphql);
}