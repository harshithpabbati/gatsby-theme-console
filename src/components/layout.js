import React from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql, Link } from "gatsby"
import "../styles/style.sass"

import Header from "./header"

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
        allConfigYaml{
            edges{
                node{
                    title
                    webcounterlink
                }
            }
        }
    }
  `)

  return (
    <div className="content-wrapper">
      <Header siteTitle={data.allConfigYaml.edges[0].node.title} />
      <div
      >
        <main>{children}</main>
        <footer className="footer m-0">
          <div className="menu-footer">
            <ul>
              <div style={{textAlign: 'center'}}>
                <Link to="/contact" style={{float: 'left'}}>
                  <li>contact</li>
                </Link>
                <li>Made with <a href="https://github.com/harshithpabbati/gatsby-theme-console">Gatsby</a>.</li>
              </div>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
