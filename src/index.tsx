import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash/debounce';

interface Feature {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

interface Props {
  children?: React.ReactNode;
  url?: string;
  name?: string;
  title?: string;
  width?: number;
  height?: number;
  initPosition?: () => Feature;
  onOpen?: (w: Window) => void;
  onClose?: () => void;
  onBlock?: () => void;
  copyStyles?: boolean;
}

interface State {
  mounted: boolean;
}

const onNewWindowResize = debounce(() => {
  // add/remove element on main document, force it to dispatch resize observer event on the popup window
  let div = document.createElement('div');
  document.body.append(div);
  div.remove();
  // TODO update resize event
}, 200);

/**
 * The NewWindow class object.
 * @public
 */

class NewWindow extends React.PureComponent<Props, State> {
  /**
   * NewWindow default props.
   */
  static defaultProps: Props = {
    url: '',
    name: '',
    width: 640,
    height: 480,
    copyStyles: true,
  };

  window: Window;

  released = false;

  container = document.createElement('div');

  state: State = { mounted: false };

  /**
   * The NewWindow function constructor.
   * @param {Object} props
   */
  constructor(props: Props) {
    super(props);
  }

  /**
   * Render the NewWindow component.
   */
  render() {
    if (!this.state.mounted) return null;
    return ReactDOM.createPortal(this.props.children, this.container);
  }

  componentDidMount() {
    this.openChild();
    this.setState({ mounted: true });
  }

  /**
   * Create the new window when NewWindow component mount.
   */
  openChild() {
    const { url, title, name, width, height, initPosition, onBlock, onOpen } = this.props;

    let features: Feature = { width, height };

    if (initPosition) {
      features = initPosition();
    } else {
      features.left = window.top.outerWidth / 2 + window.top.screenX - width / 2;
      features.top = window.top.outerHeight / 2 + window.top.screenY - height / 2;
    }

    // Open a new window.
    this.window = window.open(url, name, toWindowFeatures(features));

    // Check if the new window was successfully opened.
    if (this.window) {
      window.addEventListener('beforeunload', this.onMainWindowUnload);
      this.window.addEventListener('resize', onNewWindowResize);

      this.window.document.title = title || document.title;
      this.window.document.body.appendChild(this.container);

      // If specified, copy styles from parent window's document.
      if (this.props.copyStyles) {
        setTimeout(() => copyStyles(document, this.window.document), 0);
      }

      if (typeof onOpen === 'function') {
        onOpen(this.window);
      }

      // Release anything bound to this component before the new window unload.
      this.window.addEventListener('beforeunload', this.release);
    } else {
      // Handle error on opening of new window.
      if (typeof onBlock === 'function') {
        onBlock();
      } else {
        console.warn('A new window could not be opened. Maybe it was blocked.');
      }
    }
  }

  onMainWindowUnload = () => {
    if (this.window) {
      this.window.close();
    }
  };

  /**
   * Close the opened window (if any) when NewWindow will unmount.
   */
  componentWillUnmount() {
    if (this.window) {
      this.release();
      this.window.close();
    }
  }

  /**
   * Release the new window and anything that was bound to it.
   */
  release = (event?: Event) => {
    // This method can be called once.
    if (this.released) {
      return;
    }
    this.released = true;

    window.removeEventListener('beforeunload', this.onMainWindowUnload);
    this.window.addEventListener('beforeunload', this.release);

    if (event) {
      // Call any function bound to the `onUnload` prop.
      const { onClose } = this.props;

      if (typeof onClose === 'function') {
        onClose();
      }
    }
  };
}

/**
 * Utility functions.
 * @private
 */

/**
 * Copy styles from a source document to a target.
 * @param {Object} source
 * @param {Object} target
 * @private
 */

function copyStyles(source: Document, target: Document) {
  Array.from(source.styleSheets).forEach(styleSheet => {
    // For <style> elements
    let rules;

    if (styleSheet.href) {
      // for <link> elements loading CSS from a URL
      const newLinkEl = source.createElement('link');

      newLinkEl.rel = 'stylesheet';
      newLinkEl.href = styleSheet.href;
      target.head.appendChild(newLinkEl);
    } else {
      try {
        rules = styleSheet.cssRules;
      } catch (err) {
        // can't access crossdomain rules
      }
      if (rules) {
        const newStyleEl = source.createElement('style');

        // Write the text of each rule into the body of the style element
        Array.from(styleSheet.cssRules).forEach(cssRule => {
          const { cssText, type } = cssRule;
          let returnText = cssText;
          // Check if the cssRule type is CSSImportRule (3) or CSSFontFaceRule (5) to handle local imports on a about:blank page
          // '/custom.css' turns to 'http://my-site.com/custom.css'
          if ([3, 5].includes(type)) {
            returnText = cssText
              .split('url(')
              .map(line => {
                if (line[1] === '/') {
                  return `${line.slice(0, 1)}${window.location.origin}${line.slice(1)}`;
                }
                return line;
              })
              .join('url(');
          }
          newStyleEl.appendChild(source.createTextNode(returnText));
        });

        target.head.appendChild(newStyleEl);
      }
    }
  });
}

/**
 * Convert features props to window features format (name=value,other=value).
 * @param {Object} obj
 * @return {String}
 * @private
 */

function toWindowFeatures(obj: any) {
  return Object.keys(obj)
    .reduce((features, name) => {
      const value = obj[name];
      if (typeof value === 'boolean') {
        features.push(`${name}=${value ? 'yes' : 'no'}`);
      } else {
        features.push(`${name}=${value}`);
      }
      return features;
    }, [])
    .join(',');
}

/**
 * Component export.
 * @private
 */

export default NewWindow;
