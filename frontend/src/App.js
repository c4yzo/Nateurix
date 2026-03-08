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
import PurchaseHistory from './pages/PurchaseHistory/PurchaseHistory';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import NotFound from './pages/NotFound/NotFound';
import './App.scss';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/my-ads" element={<MyAds />} />
            <Route path="/edit-listing/:id" element={<EditListing />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/purchases" element={<PurchaseHistory />} />
            <Route path="/order-success/:id" element={<OrderSuccess />} />
            <Route path="/order-failed" element={<OrderFailed />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
