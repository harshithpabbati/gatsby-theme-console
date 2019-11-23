import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"

const Header = () => (
  <header>
    <div className="menu">
      <ul>
        <Link to="/">
          <li>/home</li>
        </Link>
        <Link to="/blog">
          <li>/blog</li>
        </Link>
        <Link to="/about">
          <li>/about</li>
        </Link>
        <Link to="/contact">
          <li>/contact</li>
        </Link>
      </ul>
    </div>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header