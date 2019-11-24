import React from "react"
import Layout from "../components/layout"
import { graphql } from "gatsby"
import SEO from "../components/seo"


export default class ProjectTemplate extends React.Component{
  render() {
    return(
      <Layout>
        <SEO title={this.props.data.projectsYaml.title} />
        <div className="content">
          <h3>{this.props.data.projectsYaml.title}</h3>
          <p className="p-4" dangerouslySetInnerHTML={{ __html: this.props.data.projectsYaml.content}} />
        </div>
      </Layout>
    )
  }
}
export const pageQuery = graphql`
    query($slug: String!) {
        projectsYaml(slug: { eq: $slug }) {
            title
            slug
            content
        }
    }
`
