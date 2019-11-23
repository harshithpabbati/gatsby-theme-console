import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import '../styles/style.sass'

export default class IndexPage extends React.Component{
  render() {
    return(
      <Layout>
        <SEO title="Home" />
        <h1>Blog</h1>
        <div className="list">
          <ul>
            {this.props.data.allBlogYaml.edges.map(edge => (
              <Link to={`/blog/` + edge.node.slug}>
                <li>{edge.node.title}</li>
              </Link>
            ))}
          </ul>
        </div>
      </Layout>
    )
  }
}
export const pageQuery = graphql`
    {
        allBlogYaml{
            edges{
                node{
                    title
                    slug
                    content
                }
            }
        }
    }
`
