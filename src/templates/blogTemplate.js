import React from "react"
import Layout from "../components/layout"
import { graphql, Link } from "gatsby"
import SEO from "../components/seo"


export default class ProjectTemplate extends React.Component{
  render() {
    return(
      <Layout>
        <SEO title={this.props.data.markdownRemark.frontmatter.title} />
        <div className="content">
          <Link to={`/projects/` + this.props.data.markdownRemark.frontmatter.project}>
            <span className="badge p-2 mr-1 badge-dark">{this.props.data.markdownRemark.frontmatter.project}</span>
          </Link>
          <h3 className="p-2">{this.props.data.markdownRemark.frontmatter.title}</h3>
          <h5 className="p-2"> - {this.props.data.markdownRemark.frontmatter.author}</h5>
          <p style={{float: 'right'}}>{this.props.data.markdownRemark.frontmatter.date}</p><br />
          <p className="p-2" dangerouslySetInnerHTML={{ __html: this.props.data.markdownRemark.html}} />
        </div>
      </Layout>
    )
  }
}
export const pageQuery = graphql`
    query PostQuery($slug: String!) {
        markdownRemark(frontmatter: { slug: { eq: $slug } }) {
            frontmatter{
                author
                slug
                title
                date
                project
            }
            html
        }
    }
`
