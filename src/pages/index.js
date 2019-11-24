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
        <h4>Blog</h4>
        <div className="list">
          <ul>
            {this.props.data.allMarkdownRemark.edges.map(edge => (
              <li className="p-1">
                <Link to={`/blog/` + edge.node.frontmatter.slug}>
                  [ {edge.node.frontmatter.date} ]: {edge.node.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Layout>
    )
  }
}
export const pageQuery = graphql`
    {
        allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }
            filter: { frontmatter: { draft: { ne: true } } }){
            edges{
                node{
                    frontmatter{
                        title
                        date
                        slug
                    }
                    html
                }
            }
        }
    }
`
