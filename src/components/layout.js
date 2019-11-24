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
        <footer className="footer row m-0">
          <div className="col-sm-2 text-center">
            <Link to="/contact">
              <p>contact</p>
            </Link>
          </div>
          <div className="col-sm-8 text-center">
            <p>Made with <a href="https://github.com/harshithpabbati/gatsby-theme-console">Gatsby</a>.</p>
          </div>
          <div className="col-sm-2">
            <img src="https://www.webfreecounter.com/hit.php?id=grxakdo&nd=6&style=1" border="0" alt="visitor counter" />
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
