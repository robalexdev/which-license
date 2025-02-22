import { Component } from 'react';

var worker;

function renderChange(change) {
  let style;
  if (change['added']) {
    style = {
      'color': '#090',
      'backgroundColor': '#dfd',
      'font-weight': 'bold',
    };
  } else if (change['removed']) {
    style = {
      'color': '#900',
      'backgroundColor': '#fdd',
      'text-decoration': 'line-through',
    };
  } else {
    style = {
      'color': '#333',
    };
  }

  let parts = change.value.replace('\n', '⏎\n').split('\n');
  let changed = parts.map(a => [
    (
      <span style={style}>
      {a}
      </span>
    ),
    (<br />)
  ]).flat();
  changed.pop();
  return changed;
}

interface DetectState {
  text: string
  workerLoaded: boolean
  workerRunning: boolean
  progress: number,
  maxProgress: number,
  results: Array<DetectResult>,
  licenseTab: number,
}

interface DetectResult {
  score: number
  spdx: string
  best: {
    name: string
    url: string
  }
  changes: Array<{
    added: string
    removed: string
  }>
}

export default class Example extends Component<{}, DetectState> {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      workerLoaded: false,
      workerRunning: false,
      maxProgress: 1,
      progress: 0,
      results: null,
      licenseTab: 0,
    };
  }

  componentDidMount() {
    worker = new Worker(new URL('../worker/detect.worker.tsx', import.meta.url))

    worker.addEventListener('message', (e) => {
      this.setState(e.data);
    });
  }

  componentWillUnmount() {
    worker.terminate();
  }

  render() {
    if (this.state.workerRunning) {
      return (
        <>
        <h1 className="subtitle">Searching...</h1>
        <progress className="progress is-large is-dark m-4" value={ this.state.progress } max={ this.state.maxProgress } />
        </>
      )
    } else if (this.state.results !== null) {
      if (this.state.results.length < 1) {
        return (<>
          <button
            className="button is-link mb-5"
            onClick={(e) => {
              this.setState({
                text: '',
                results: null,
              });
            }}>
            <span className="icon mr-1">
              ⯇
            </span>
            Try another
          </button>

          <div className="notification is-danger is-light p-5 pb-6">
            <div className="container">
            <h1 className="title pb-4">Unable to detect license</h1>
            <p>
            We can&apos;t determine which license this is.
            We checked <a href="https://github.com/spdx/license-list-data">the SPDX license list</a> via <a href="https://www.npmjs.com/package/spdx-license-list">the spdx-license-list package.</a>
            </p>
            <p>
            If you think there&apos;s a bug in the detection, you can create <a href="https://github.com/ralexander-phi/which-license/issues">an issue</a>, I&apos;ll take a look.
            </p>
            <p>
            If this license isn&apos;t part of the SPDX license list, you may be able to <a href="https://github.com/spdx/license-list-XML/blob/master/DOCS/license-inclusion-principles.md">get it added.</a>
            </p>
            </div>
          </div>
          </>);
      } else {
        return (<>
          <button
            className="button is-link mb-5"
            onClick={(e) => {
              this.setState({
                text: '',
                results: null,
              });
            }}>
            <span className="icon mr-1">
              ⯇
            </span>
            Try another
          </button>

          <div className="notification is-warning">
          <h3 className="subtitle is-4 pb-4">These are the best matches.</h3>
          Your license text may have meaningful differences.
          Please review any changes below.
          </div>

          <div className="tabs is-boxed">
            <ul>
              { this.state.results.map((result, index) => {
                return (
                  <li key={index} className={ this.state.licenseTab === index ? "is-active" : "" }>
                    <a onClick={(e) => {
                        this.setState({
                          licenseTab: index,
                        });
                      }}>
                      { result.best.name }
                    </a>
                  </li>
                )})
              }
            </ul>
          </div>

          <div className="notification is-info p-5 pb-6">
            <h2 className="subtitle pb-4 is-2">{ this.state.results[this.state.licenseTab].best.name }</h2>

            <p className="pt-2 pb-4">
              {/* TODO TLDR link */}
              { this.state.results[this.state.licenseTab].best.url &&
                  <a href={ this.state.results[this.state.licenseTab].best.url }>Learn More</a>
              }
            </p>

            <h2 className="subtitle is-3 pt-5 mb-1">
              Changes:
            </h2>
            <div className="content">
              <div className="box pb-6 pr-6">
              { this.state.results[this.state.licenseTab].changes.map(change => renderChange(change)) }
              </div>
            </div>
          </div>
          </>);
      }
    } else {
      var searchClassExtra = ''
      if (! this.state.workerLoaded) {
        searchClassExtra = "is-loading";
      }
      return (<>
        <h3 className="subtitle">Identify common software licenses</h3>

        <textarea
        style={{
          width: '100%',
        }}
        onChange={e => {
          this.setState({ 
            text: e.target.value,
          });
        }}
        rows={10}
        value={this.state.text} />

        <p className="help is-info">
          Paste a software license to identify it.
          For example, try the text of <a href="https://mit-license.org/">the MIT license</a>.
        </p>

        <button
          className={ searchClassExtra + " button is-primary is-medium mt-3" }
          disabled={! this.state.workerLoaded}
          onClick={e => {
            // TODO button double click?
            worker.postMessage({ text: this.state.text });
        }}>Search</button>
        </>);
    }
  }
}
