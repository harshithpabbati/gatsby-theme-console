import React from "react"
import Layout from "../components/layout"
import { graphql } from "gatsby"
import SEO from "../components/seo"


export default class ProjectTemplate extends React.Component{
  render() {
    return(
      <Layout>
        <SEO title={this.props.data.blogYaml.title} />
        <div className="content">
          <h1>{this.props.data.blogYaml.title}</h1>
          <p dangerouslySetInnerHTML={{ __html: this.props.data.blogYaml.content}} />
        </div>
      </Layout>
    )
  }
}
export const pageQuery = graphql`
    query($slug: String!) {
        blogYaml(slug: { eq: $slug }) {
            title
            slug
            content
        }
    }
`
