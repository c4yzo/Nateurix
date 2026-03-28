import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import CreateListing from './pages/CreateListing/CreateListing';
import ListingDetail from './pages/ListingDetail/ListingDetail';
import MyAds from './pages/MyAds/MyAds';
import EditListing from './pages/EditListing/EditListing';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import OrderSuccess from './pages/OrderSuccess/OrderSuccess';
import OrderFailed from './pages/OrderFailed/OrderFailed';
import PlantIdentifier from './pages/PlantIdentifier/PlantIdentifier';
import PurchaseHistory from './pages/PurchaseHistory/PurchaseHistory';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import NotFound from './pages/NotFound/NotFound';
import AgriBotWidget from './components/AgriBotWidget/AgriBotWidget';
import './App.scss';

import { useEffect } from 'react';

const PageWrapper = ({ title, children }) => {
  useEffect(() => {
    document.title = `${title} | Nateurix`;
  }, [title]);

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <AgriBotWidget />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PageWrapper title="Home"><Home /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper title="Login"><Login /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper title="Register"><Register /></PageWrapper>} />
            <Route path="/create-listing" element={<PageWrapper title="Sell an Item"><CreateListing /></PageWrapper>} />
            <Route path="/listing/:id" element={<PageWrapper title="Listing Details"><ListingDetail /></PageWrapper>} />
            <Route path="/my-ads" element={<PageWrapper title="My Shop"><MyAds /></PageWrapper>} />
            <Route path="/edit-listing/:id" element={<PageWrapper title="Edit Listing"><EditListing /></PageWrapper>} />
            <Route path="/cart" element={<PageWrapper title="Cart"><Cart /></PageWrapper>} />
            <Route path="/checkout" element={<PageWrapper title="Checkout"><Checkout /></PageWrapper>} />
            <Route path="/identify" element={<PageWrapper title="AI Identifier"><PlantIdentifier /></PageWrapper>} />
            <Route path="/purchases" element={<PageWrapper title="Purchase History"><PurchaseHistory /></PageWrapper>} />
            <Route path="/order-success/:id" element={<PageWrapper title="Payment Success"><OrderSuccess /></PageWrapper>} />
            <Route path="/order-failed" element={<PageWrapper title="Payment Failed"><OrderFailed /></PageWrapper>} />
            <Route path="/admin/login" element={<PageWrapper title="Admin Login"><AdminLogin /></PageWrapper>} />
            <Route path="/admin/dashboard" element={<PageWrapper title="Admin Dashboard"><AdminDashboard /></PageWrapper>} />
            <Route path="*" element={<PageWrapper title="404 Not Found"><NotFound /></PageWrapper>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
