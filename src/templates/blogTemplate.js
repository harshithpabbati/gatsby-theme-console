import React from "react"
import Layout from "../components/layout"
import { graphql, Link } from "gatsby"
import SEO from "../components/seo"


export default function BlogTemplate({ data: { markdownRemark } }) {
  function generateHTML() {
    return {__html: markdownRemark.html};
  }
  return(
    <Layout>
      <SEO title={markdownRemark.frontmatter.title} />
      <div className="content">
        {markdownRemark.frontmatter.tags.map(tag => (
          <span className="badge badge-dark">{tag}</span>
        ))}
        <h3 className="p-2">{markdownRemark.frontmatter.title}</h3>
        <h5 className="p-2"> - {markdownRemark.frontmatter.author}</h5>
        <p style={{float: 'right'}}>{markdownRemark.frontmatter.date}</p><br />
        <div dangerouslySetInnerHTML={generateHTML()} />
      </div>
    </Layout>
  )
}
export const pageQuery = graphql`
    query PostQuery($slug: String!) {
        markdownRemark(frontmatter: { slug: { eq: $slug } }) {
            frontmatter{
                author
                slug
                title
                date
                tags
            }
            html
        }
    }
`
