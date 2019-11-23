const path = require("path")

function createBlogPages(result, createPage) {
  const BlogTemplate = path.resolve(`src/templates/blogTemplate.js`)
  const blogs = result.data.allBlogYaml.edges
  blogs.forEach(({ node }) => {
    createPage({
      path: "/blog" + "/" + node.slug,
      component: BlogTemplate,
      context: {
        slug: node.slug
      },
    })
  })
}

function graphqlForBlog(graphql, createPage) {
  return graphql(`
    {
  allBlogYaml(sort: { fields: slug, order: ASC }){
    edges{
      node{
        title
        slug
        content
      }
    }
  }
}
  `).then(result => {
    if (result.errors) {
      throw result.errors
    }
    createBlogPages(result, createPage)
  })
}

exports.graphqlForBlog = graphqlForBlog