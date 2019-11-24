import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { graphql } from "gatsby"


export default class Contact extends React.Component{
  render() {
    return(
      <Layout>
        <SEO title="Contact" />
        <h3>Contact</h3>
        <div className="p-4">
          <p>Name: {this.props.data.allConfigYaml.edges[0].node.author}</p>
          <p>Email: {this.props.data.allConfigYaml.edges[0].node.authoremail}</p>
          <p>IRC: {this.props.data.allConfigYaml.edges[0].node.authorirc}</p>
        </div>
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