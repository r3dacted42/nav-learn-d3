import D3Map from "./components/D3Map";
import './App.css';
import 'material-icons/iconfont/material-icons.css';

function App() {
  return (
    <div className="App">
      <div className="title-bar">
        <span className="title">Navigated Learning Task</span>
        <span style={{"flexGrow": 1}}></span>
        <a className="btn" href="https://github.com/r3dacted42/nav-learn-d3">Github Repo</a>
      </div>
      <D3Map />
    </div>
  );
}

export default App;
