import React from "react"
import Layout from "../components/layout"
import { graphql } from "gatsby"
import SEO from "../components/seo"


export default function BlogTemplate({ data: { projectsYaml } }) {
  return(
    <Layout>
      <SEO title={projectsYaml.title} />
      <div className="content">
        <h3>{projectsYaml.title}</h3>
        <p className="p-4" dangerouslySetInnerHTML={{ __html: projectsYaml.content}} />
      </div>
    </Layout>
  )
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
