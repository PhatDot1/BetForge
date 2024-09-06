import "./App.css";
import { Header, Footer } from "./components";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Details from "./pages/Details/Details";
import Details1 from "./pages/Details/Details1";// now redundant?
import Details2 from "./pages/Details/Details2";// now redundant?
import Details3 from "./pages/Details/Details3";// now redundant?
import Details4 from "./pages/Details/Details4";// now redundant?
import Details5 from "./pages/Details/Details5";// now redundant?
import ScrollToTop from "./components/ScrollToTop";
import Olympic100m from "./pages/Bet/Olympics/100m/100m";// now redundant?
import Events from "./pages/Bet/Olympics/Events"; 
import Olympic200m from "./pages/Bet/Olympics/200m/200m";  // now redundant?
import { WalletProvider } from "./contexts/WalletContext"; 
import Bridge from "./pages/Bridge/Bridge";
import MyCollection from "./pages/MyCollection/MyCollection"; 
import UserListed from "./pages/UserListed/UserListed";
import Soccer from './pages/Bet/Soccer';

function App() {
  return (
    <WalletProvider>
      <Router>  {/* Move Router here */}
        <ScrollToTop /> {/* Add ScrollToTop here */}
        <div
          style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        >
          <Header />  {/* Now Header is inside Router */}
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/details" element={<Details />} />
              <Route path="/details1" element={<Details1 />} />
              <Route path="/details2" element={<Details2 />} />
              <Route path="/details3" element={<Details3 />} />
              <Route path="/details4" element={<Details4 />} />
              <Route path="/details5" element={<Details5 />} />
              <Route path="/bet/olympics/100m" element={<Olympic100m />} />
              <Route path="/bet/olympics/200m" element={<Olympic200m />} /> 
              <Route path="/bet/olympics" element={<Events />} /> 
              <Route path="/bridge" element={<Bridge />} /> 
              <Route path="/my-collection" element={<MyCollection />} /> 
              <Route path="/user-listed" element={<UserListed />} /> 
              <Route path="/bet/soccer" element={<Soccer />} /> 
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>  {/* Close Router here */}
    </WalletProvider>
  );
}

export default App;
