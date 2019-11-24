const path = require("path")

function createBlogPages(result, createPage) {
  const BlogTemplate = path.resolve(`src/templates/blogTemplate.js`)
  const blogs = result.data.allMarkdownRemark.edges
  blogs.forEach(({ node }) => {
    createPage({
      path: "/blog" + "/" + node.frontmatter.slug,
      component: BlogTemplate,
      context: {
        slug: node.frontmatter.slug
      },
    })
  })
}

function graphqlForBlog(graphql, createPage) {
  return graphql(`
    {
        allMarkdownRemark(filter: { frontmatter: { draft: { ne: true } } }){
            edges{
                node{
                    frontmatter{
                        title
                        author
                        date
                        slug
                    }
                    html
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