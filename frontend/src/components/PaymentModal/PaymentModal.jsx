import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentModal.scss';

const PaymentModal = ({ checkoutData, onClose }) => {
    const [processing, setProcessing] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        number: '',
        name: '',
        expiry: '',
        cvc: ''
    });

    const navigate = useNavigate();
    const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;

    const handleInputChange = (e) => {
        setCardDetails({
            ...cardDetails,
            [e.target.name]: e.target.value
        });
    };

    const handleSimulatePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);

        // Simulate network delay for realistic feel
        setTimeout(async () => {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };

                // Submit mock signature to backend
                const payload = {
                    orderId: checkoutData.orderId,
                    rentalOrderIds: checkoutData.rentalOrderIds,
                    transactionId: checkoutData.transactionId,
                    signature: 'mock_success_signature' // Mocks razorpay_signature
                };

                await axios.post('/api/orders/verify-payment', payload, config);

                setProcessing(false);
                const redirectId = checkoutData.orderId || (checkoutData.rentalOrderIds && checkoutData.rentalOrderIds[0]);
                navigate(`/order-success/${redirectId}`);
            } catch (err) {
                console.error(err);
                setProcessing(false);
                navigate('/order-failed');
            }
        }, 2000);
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal">
                <button className="close-btn" onClick={onClose} disabled={processing}>&times;</button>

                <div className="modal-header">
                    <h3>Complete Payment</h3>
                    <p>Total amount: <strong>${checkoutData.totalPrice.toFixed(2)}</strong></p>
                    <small>Transaction ID: {checkoutData.transactionId}</small>
                </div>

                <form onSubmit={handleSimulatePayment} className="mock-payment-form">
                    <div className="form-group">
                        <label>Card Number (Mock)</label>
                        <input
                            type="text"
                            name="number"
                            placeholder="0000 0000 0000 0000"
                            value={cardDetails.number}
                            onChange={handleInputChange}
                            required
                            disabled={processing}
                        />
                    </div>

                    <div className="form-group">
                        <label>Name on Card</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            value={cardDetails.name}
                            onChange={handleInputChange}
                            required
                            disabled={processing}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>Expiry Date</label>
                            <input
                                type="text"
                                name="expiry"
                                placeholder="MM/YY"
                                value={cardDetails.expiry}
                                onChange={handleInputChange}
                                required
                                disabled={processing}
                            />
                        </div>
                        <div className="form-group half">
                            <label>CVC</label>
                            <input
                                type="text"
                                name="cvc"
                                placeholder="123"
                                value={cardDetails.cvc}
                                onChange={handleInputChange}
                                required
                                disabled={processing}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary pay-btn" disabled={processing}>
                        {processing ? 'Processing Payment...' : `Pay $${checkoutData.totalPrice.toFixed(2)} Securely`}
                    </button>

                    <p className="mock-disclaimer">
                        *This is a simulated payment gateway. No real charges are made. Any random data works.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
