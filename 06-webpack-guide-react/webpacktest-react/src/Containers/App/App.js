'use strict';

import React, {Component} from 'react';
import PropTypes from 'prop-types';

class App extends Component {
  static propTypes = {
    myProp: PropTypes.any
  };
  static defaultProps = {
    myProp: null
  };

  constructor (props) {
    console.log('App constructor', props);
    super(props);

    this.state = {
      aVal: 1,
      bVal: 2,
      cVal: 3
    };

    this.onClickHandler = ::this.onClickHandler;
  }

  onClickHandler () {
    this.setState({
      aVal: this.state.aVal + 1
    });
  }

  render () {
    console.log('App render', this.props);
    const {aVal} = this.state;
    return (
      <div
        onClick={this.onClickHandler}
        className="template-component"
      >
        {`I am App and this is my value: ${aVal}`}
      </div>
    );
  }
}

export default App;
