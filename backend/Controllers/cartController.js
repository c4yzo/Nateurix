import Cart from '../Models/Cart.js';
import Listing from '../Models/Listing.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate({
            path: 'items.listing',
            select: 'title price imageUrl stockCount status category transactionType'
        });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
    const { listingId, quantity, daysRented } = req.body;

    try {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (parseInt(quantity) > listing.stockCount) {
            return res.status(400).json({ message: `Cannot add more than available stock (${listing.stockCount})` });
        }

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.listing.toString() === listingId);

        if (itemIndex > -1) {
            // Item exists in cart, check new total quantity
            const newQuantity = cart.items[itemIndex].quantity + parseInt(quantity);
            if (newQuantity > listing.stockCount) {
                return res.status(400).json({ message: `Cannot add more than available stock (${listing.stockCount}). You already have ${cart.items[itemIndex].quantity} in cart.` });
            }
            cart.items[itemIndex].quantity = newQuantity;
            if (daysRented) {
                cart.items[itemIndex].daysRented = parseInt(daysRented);
            }
        } else {
            // Item does not exist in cart
            cart.items.push({
                listing: listingId,
                quantity: parseInt(quantity),
                daysRented: parseInt(daysRented) || 1
            });
        }

        await cart.save();

        // Re-populate for response
        cart = await Cart.findById(cart._id).populate({
            path: 'items.listing',
            select: 'title price imageUrl stockCount status category transactionType'
        });

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update quantity of cart item
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res) => {
    const { listingId, quantity, daysRented } = req.body;

    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.listing.toString() === listingId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not in cart' });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            // Remove item from cart if product no longer exists
            cart.items.splice(itemIndex, 1);
            await cart.save();
            return res.status(404).json({ message: 'Listing no longer exists' });
        }

        if (parseInt(quantity) > listing.stockCount) {
            return res.status(400).json({ message: `Cannot update quantity to more than available stock (${listing.stockCount})` });
        }

        if (parseInt(quantity) <= 0) {
            // Remove item if quantity is 0 or less
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = parseInt(quantity);
            if (daysRented) {
                cart.items[itemIndex].daysRented = parseInt(daysRented);
            }
        }

        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.listing',
            select: 'title price imageUrl stockCount status category transactionType'
        });

        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Private
export const removeFromCart = async (req, res) => {
    const { listingId } = req.body;

    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.listing.toString() !== listingId);

        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.listing',
            select: 'title price imageUrl stockCount status category transactionType'
        });

        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
