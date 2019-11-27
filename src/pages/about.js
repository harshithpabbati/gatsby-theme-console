import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { graphql } from "gatsby"


export default class About extends React.Component{
  render() {
    return (
      <Layout>
        <SEO title="About" />
        <h3>About</h3>
        <div className="p-4" dangerouslySetInnerHTML={{ __html: this.props.data.allConfigYaml.edges[0].node.about}} />
      </Layout>
    )
  }
}

export const pageQuery = graphql`
    {
        allConfigYaml{
            edges{
                node{
                    title
                    description
                    author
                    authoremail
                    authorirc
                    about
                }
            }
        }
    }
`;